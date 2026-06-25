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
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const zegoContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptSegmentsRef = useRef([]);
  const zpRef = useRef(null);

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
          showScreenSharingButton: true,
          onLeaveRoom: () => {
              endMeeting();
          }
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

  // Transcription
  const startTranscription = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser. Please use Chrome for transcriptions.');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.language = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsTranscribing(true);
    };

    recognitionRef.current.onresult = (event) => {
      let currentInterim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const resultText = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          transcriptSegmentsRef.current.push({
            timestamp: new Date(),
            speakerId: user?._id,
            speakerName: user?.name,
            text: resultText,
            duration: 0
          });

          socket.emit('transcript-segment', {
            meetingId,
            userId: user?._id,
            userName: user?.name,
            text: resultText,
            timestamp: new Date()
          });

          setTranscript(prev => prev + '\nMe: ' + resultText);
        } else {
          currentInterim += resultText;
        }
      }
      setInterimTranscript(currentInterim);
    };

    recognitionRef.current.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      console.warn('Speech recognition error:', event.error);
    };

    recognitionRef.current.onend = () => {
      // Auto-restart if we didn't deliberately stop it
      if (recognitionRef.current && !isEnding) {
          try {
              recognitionRef.current.start();
          } catch(e) {}
      } else {
        setIsTranscribing(false);
      }
    };

    try {
        recognitionRef.current.start();
    } catch(e) {}
  };

  // End meeting
  const endMeeting = async () => {
    if (isEnding) return;
    setIsEnding(true);

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      await axios.post(`/meetings/${meetingId}/end`, {
        transcriptSegments: transcriptSegmentsRef.current,
        attendeeIds: user ? [user._id] : [] // Zegocloud handles its own participant list, we'll just log ourselves, or could fetch from Zego if needed
      });

      navigate(`/meetings/${meetingId}/mom`);
    } catch (error) {
      console.error('Error ending meeting:', error);
      alert('Failed to end meeting');
      setIsEnding(false);
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
      <div className="w-80 bg-v-secondary border-l border-v-border flex flex-col">
        <div className="p-4 border-b border-v-border flex justify-between items-center bg-v-primary">
            <h3 className="font-semibold text-v-text flex items-center gap-2">
                Live Transcript
            </h3>
            {isTranscribing && (
                <span className="flex items-center gap-1 text-xs text-blue-400 font-medium bg-blue-400/10 px-2 py-1 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                    Listening
                </span>
            )}
        </div>
        <div className="flex-1 p-4 overflow-y-auto text-sm text-v-text space-y-3 whitespace-pre-wrap flex flex-col font-mono bg-[#1e1e1e]">
            {transcript || (
                <span className="text-v-muted text-center mt-10 italic">
                    Start speaking... Transcript will appear here.
                </span>
            )}
            {interimTranscript && (
                <span className="text-blue-400 italic animate-pulse">Me: {interimTranscript}</span>
            )}
        </div>
      </div>
    </div>
  );
};
