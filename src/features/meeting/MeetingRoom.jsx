import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from '../../utils/axiosInstance';
import { socket } from '../../utils/socket';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

export const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);

  const [meeting, setMeeting] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState(''); // Live "typing" display
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const zegoContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptSegmentsRef = useRef([]);
  const zpRef = useRef(null);
  const isRecognitionActiveRef = useRef(false); // Tracks active state to prevent double-start
  const transcriptBodyRef = useRef(null);

  // Auto-scroll when new transcript added
  useEffect(() => {
    if (transcriptBodyRef.current) {
      transcriptBodyRef.current.scrollTop = transcriptBodyRef.current.scrollHeight;
    }
  }, [transcript]);

  // Fetch meeting data on mount
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMeeting();
    return () => {
      leaveMeeting();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, user]);

  // When meeting data is ready and container is rendered, initialize ZEGOCLOUD
  useEffect(() => {
    if (meeting && zegoContainerRef.current && !zpRef.current) {
        initZegoCloud();
    }
  }, [meeting, zegoContainerRef]);

  const fetchMeeting = async () => {
    try {
      const response = await axios.get(`/meetings/${meetingId}`);
      setMeeting(response.data.meeting);
      
      // Start backend socket for transcript sync
      if (!socket.connected) {
        socket.connect();
      }

      socket.emit('join-meeting', {
        meetingId,
        userId: user?._id,
        userName: user?.name
      });

      socket.on('new-transcript', handleNewTranscript);

      // Start transcription
      startTranscription();

      // Mark as live if host
      if (response.data.meeting.hostId === user?._id || response.data.meeting.hostId?._id === user?._id) {
          await axios.post(`/meetings/${meetingId}/start`);
      }

    } catch (error) {
      console.error('Error fetching meeting:', error);
      alert('Failed to load meeting');
      navigate(-1);
    }
  };

  const initZegoCloud = async () => {
      const appID = parseInt(import.meta.env.VITE_ZEGO_APP_ID, 10);
      const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;
      
      if (!appID || !serverSecret) {
          console.error("ZEGOCLOUD credentials missing in .env");
          alert("ZEGOCLOUD credentials missing. Video calling will not work.");
          return;
      }

      // Generate token
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID, 
          serverSecret, 
          meetingId, 
          user?._id?.toString() || 'guest', 
          user?.name || "Guest"
      );

      // Create instance object
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zpRef.current = zp;

      // Join the room
      zp.joinRoom({
          container: zegoContainerRef.current,
          sharedLinks: [
              {
                  name: 'Meeting Link',
                  url: window.location.href,
              },
          ],
          scenario: {
              mode: ZegoUIKitPrebuilt.VideoConference,
          },
          showLeaveRoomConfirmDialog: false,
          showLeavingView: false,
          onLeaveRoom: handleMeetingEnd,
          showScreenSharingButton: true,
          maxUsers: 20,
          layout: 'Grid',
          showUserNameOnView: true,
      });
  };

  const handleNewTranscript = (data) => {
      transcriptSegmentsRef.current.push({
          timestamp: data.timestamp || new Date(),
          speakerId: data.userId,
          speakerName: data.userName,
          text: data.text,
          duration: 0
      });
      setTranscript(prev => prev + '\n' + data.userName + ': ' + data.text);
  };

  const mediaRecorderRef = useRef(null);

  // Transcription
  const startTranscription = async () => {
    try {
      // We explicitly request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use webm for browser compatibility (Chrome/Firefox)
      const options = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && !isEnding) {
          const formData = new FormData();
          formData.append('audio', event.data, 'chunk.webm');
          
          try {
            const res = await axios.post('/ai/transcribe', formData, {
               headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (res.data.text && res.data.text.trim()) {
              const text = res.data.text.trim();
              
              transcriptSegmentsRef.current.push({
                timestamp: new Date(),
                speakerId: user._id,
                speakerName: user.name,
                text: text,
                duration: 0
              });

              socket.emit('transcript-segment', {
                meetingId,
                userId: user._id,
                userName: user.name,
                text: text,
                timestamp: new Date()
              });

              setTranscript(prev => (prev ? prev + ' ' + text : text));
            }
          } catch (err) {
            console.error('Transcription API Error:', err);
          }
        }
      };

      // Send chunks every 5 seconds to the backend
      mediaRecorder.start(5000); 
      setIsTranscribing(true);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
    }
  };
  // ✅ NEW: Handles full meeting end flow
  const handleMeetingEnd = async () => {
    // Prevent double-trigger
    if (isEnding) return;
    setIsEnding(true);

    try {
      // Step 1: Stop media recorder cleanly
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }

      // Step 2: Give recognition 500ms to flush final segment
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Collect all attendee IDs
      const attendeeIds = [user._id];

      // Step 4: Send transcript + end meeting to backend
      await axios.post(`/meetings/${meetingId}/end`, {
        transcriptSegments: transcriptSegmentsRef.current,
        attendeeIds: attendeeIds
      });

      // Step 5: Navigate to MOM preview page
      navigate(`/meetings/${meetingId}/mom`);

    } catch (error) {
      console.error('Error ending meeting:', error);
      // Still navigate even on error — MOM can be generated from partial transcript
      navigate(`/meetings/${meetingId}/mom`);
    }
  };

  const leaveMeeting = () => {
    setIsEnding(true);
    
    if (zpRef.current) {
        zpRef.current.destroy();
        zpRef.current = null;
    }

    if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
    }

    if (user) {
      socket.emit('leave-meeting', {
        meetingId,
        userId: user._id
      });
    }

    socket.off('new-transcript', handleNewTranscript);
  };

  if (!meeting) {
    return (
        <div className="flex items-center justify-center h-screen bg-v-background">
            <div className="text-v-muted text-lg animate-pulse">Loading meeting room...</div>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-v-background text-v-text overflow-hidden font-sans">
      
      {/* Main Video Area using ZEGOCLOUD */}
      <div className="flex-1 relative flex flex-col">
          <div ref={zegoContainerRef} className="w-full h-full" />
      </div>

      {/* Transcript Sidebar */}
      <div className="w-80 bg-v-secondary border-l border-v-border flex flex-col relative">
        <div className="participant-badge absolute top-2 right-4 z-10 text-xs font-medium bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
          <span>👥 1 in meeting</span>
        </div>

        <div className="transcript-panel w-full h-full flex flex-col bg-v-secondary">
          <div className="transcript-header p-4 border-b border-v-border flex justify-between items-center bg-v-primary">
            <span className="font-semibold text-v-text flex items-center gap-2">Live Transcript</span>
            {isTranscribing ? (
              <span className="transcript-indicator flex items-center gap-1 text-xs text-green-400 font-medium bg-green-400/10 px-2 py-1 rounded">
                <span className="dot w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Listening
              </span>
            ) : (
              <span className="transcript-paused flex items-center gap-1 text-xs text-yellow-500 font-medium bg-yellow-500/10 px-2 py-1 rounded">
                ⏸ Paused
              </span>
            )}
          </div>

          <div className="transcript-body flex-1 p-4 overflow-y-auto text-sm text-v-text space-y-3 whitespace-pre-wrap flex flex-col font-mono bg-[#1e1e1e]" ref={transcriptBodyRef}>
            {/* Committed (final) transcript */}
            <span className="transcript-final">
              {transcript || 'Waiting for speech...'}
            </span>

            {/* Live interim (currently being spoken) — italic & dimmed */}
            {interimText && (
              <span className="transcript-interim text-gray-400 italic">
                {' '}{interimText}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
