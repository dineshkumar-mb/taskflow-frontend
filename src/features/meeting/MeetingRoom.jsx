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
  const isEndingRef = useRef(false);

  const zegoContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptSegmentsRef = useRef([]);
  const zpRef = useRef(null);
  const transcriptBodyRef = useRef(null);

  const [useFallbackVideo, setUseFallbackVideo] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // Auto-scroll when new transcript added
  useEffect(() => {
    if (transcriptBodyRef.current) {
      transcriptBodyRef.current.scrollTop = transcriptBodyRef.current.scrollHeight;
    }
  }, [transcript, interimText]);

  // Fetch meeting data on mount
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname + window.location.search } });
      return;
    }
    fetchMeeting();
    return () => {
      leaveMeeting();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, user]);

  // When meeting data is ready and container is rendered, initialize video
  useEffect(() => {
    if (meeting && zegoContainerRef.current && !zpRef.current && !useFallbackVideo) {
        initZegoCloud();
    }
  }, [meeting, zegoContainerRef, useFallbackVideo]);

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

  const startFallbackVideo = async () => {
    setUseFallbackVideo(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Local video stream error:", err);
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOff(!videoTrack.enabled);
      }
    }
  };

  const initZegoCloud = async () => {
      const rawAppID = import.meta.env.VITE_ZEGO_APP_ID;
      const serverSecret = (import.meta.env.VITE_ZEGO_SERVER_SECRET || '').trim();
      
      if (!rawAppID || rawAppID === '1861654306' || !serverSecret || serverSecret === 'b61e7733c8b28eb1bffa89eb0a297f4d') {
          console.log("[MeetingRoom] Sample ZEGOCLOUD key detected. Activating TaskFlow WebRTC Video Engine...");
          startFallbackVideo();
          return;
      }

      const appID = parseInt(rawAppID, 10);
      const cleanRoomId = (meetingId || 'room_default').toString().replace(/[^a-zA-Z0-9_]/g, '');
      const cleanUserId = (user?._id?.toString() || `guest_${Date.now()}`).replace(/[^a-zA-Z0-9_]/g, '');
      const cleanUserName = user?.name || "Guest User";

      try {
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            appID, 
            serverSecret, 
            cleanRoomId, 
            cleanUserId, 
            cleanUserName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

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
            onJoinRoomFailed: (err) => {
              console.warn("ZEGOCLOUD Join Failed, switching to TaskFlow WebRTC Video Engine:", err);
              startFallbackVideo();
            }
        });
      } catch (err) {
        console.error("ZEGOCLOUD Token / Join Error, enabling fallback:", err);
        startFallbackVideo();
      }
  };

  const handleNewTranscript = (data) => {
      transcriptSegmentsRef.current.push({
          timestamp: data.timestamp || new Date(),
          speakerId: data.userId,
          speakerName: data.userName,
          text: data.text,
          duration: 0
      });
      setTranscript(prev => (prev ? prev + '\n' + data.userName + ': ' + data.text : data.userName + ': ' + data.text));
  };

  // Live Speech Recognition & Audio Transcription
  const startTranscription = async () => {
    // 1. Web Speech API (Instant, live speech-to-text)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          if (interim) {
            setInterimText(interim);
          }

          if (finalTranscript.trim()) {
            setInterimText('');
            const text = finalTranscript.trim();
            const speakerName = user?.name || 'Speaker';

            transcriptSegmentsRef.current.push({
              timestamp: new Date(),
              speakerId: user?._id || 'user',
              speakerName: speakerName,
              text,
              duration: 0
            });

            socket.emit('transcript-segment', {
              meetingId,
              userId: user?._id,
              userName: speakerName,
              text,
              timestamp: new Date()
            });

            setTranscript(prev => (prev ? prev + '\n' + speakerName + ': ' + text : speakerName + ': ' + text));
          }
        };

        recognition.onerror = (e) => console.warn('SpeechRecognition warning:', e.error);
        recognition.onend = () => {
          if (!isEndingRef.current && recognitionRef.current) {
            try { recognition.start(); } catch (err) {}
          }
        };
        recognition.start();
        recognitionRef.current = recognition;
        setIsTranscribing(true);
      } catch (speechErr) {
        console.warn('SpeechRecognition setup warning:', speechErr);
      }
    }

    // 2. Microphone MediaRecorder backend Whisper fallback
    try {
      const stream = localStreamRef.current || await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 500 && !isEndingRef.current) {
          const formData = new FormData();
          formData.append('audio', event.data, 'chunk.webm');
          
          try {
            const res = await axios.post('/ai/transcribe', formData, {
               headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (res.data?.text && res.data.text.trim()) {
              const text = res.data.text.trim();
              const speakerName = user?.name || 'Speaker';

              transcriptSegmentsRef.current.push({
                timestamp: new Date(),
                speakerId: user?._id,
                speakerName: speakerName,
                text: text,
                duration: 0
              });

              socket.emit('transcript-segment', {
                meetingId,
                userId: user?._id,
                userName: speakerName,
                text: text,
                timestamp: new Date()
              });

              setTranscript(prev => (prev ? prev + '\n' + speakerName + ': ' + text : speakerName + ': ' + text));
            }
          } catch (err) {
            console.warn('Transcription chunk warning:', err.message);
          }
        }
      };

      mediaRecorder.start(3000); 
      setIsTranscribing(true);
    } catch (err) {
      console.warn('MediaRecorder audio stream fallback warning:', err.message);
    }
  };

  // Handles ending meeting and navigating to MOM preview
  const handleMeetingEnd = async () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    setIsEnding(true);

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
        if (mediaRecorderRef.current?.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      const validUserId = user?._id && user._id.match(/^[0-9a-fA-F]{24}$/) ? user._id : null;
      const attendeeIds = validUserId ? [validUserId] : [];

      await axios.post(`/meetings/${meetingId}/end`, {
        transcriptSegments: transcriptSegmentsRef.current || [],
        attendeeIds: attendeeIds
      });
    } catch (error) {
      console.error('Error ending meeting:', error?.response?.data || error?.message);
    } finally {
      navigate(`/meetings/${meetingId}/mom`, { replace: true });
    }
  };

  const leaveMeeting = () => {
    if (zpRef.current) {
        try { zpRef.current.destroy(); } catch (e) {}
        zpRef.current = null;
    }

    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
    }

    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
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
    <div className="flex flex-col h-screen bg-v-background text-v-text overflow-hidden font-sans">
      
      {/* Top Header Navbar */}
      <div className="h-14 bg-gray-900 border-b border-gray-800 px-6 flex items-center justify-between z-30 shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white text-base">{meeting?.title || 'Live Meeting'}</span>
          <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleMeetingEnd}
            disabled={isEnding}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition shadow-lg flex items-center gap-2 cursor-pointer"
          >
            {isEnding ? 'Ending Meeting...' : '🔴 End Meeting & Generate MOM'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative flex flex-col bg-gray-950 items-center justify-center">
          {useFallbackVideo ? (
            <div className="w-full h-full flex flex-col items-center justify-between p-6 relative">
              <div className="flex-1 w-full max-w-4xl flex items-center justify-center relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isCamOff ? 'hidden' : 'block'}`}
                />
                {isCamOff && (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-gray-400 text-sm">{user?.name || 'You'} (Camera Off)</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                  <span>{user?.name || 'You'}</span>
                  {isMicMuted && <span className="text-red-400 text-xs">🔇 Muted</span>}
                </div>
              </div>

              {/* Video Controls Bar */}
              <div className="flex items-center gap-4 mt-6 bg-gray-900/90 backdrop-blur border border-gray-800 px-6 py-3 rounded-2xl shadow-xl z-20">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full transition ${isMicMuted ? 'bg-red-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-200'}`}
                  title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMicMuted ? '🔇' : '🎙️'}
                </button>
                <button
                  onClick={toggleCam}
                  className={`p-3 rounded-full transition ${isCamOff ? 'bg-red-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-200'}`}
                  title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isCamOff ? '📷' : '📹'}
                </button>
                <button
                  onClick={handleMeetingEnd}
                  disabled={isEnding}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  🔴 End Meeting & Generate MOM
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full relative">
              <div ref={zegoContainerRef} className="w-full h-full" />
              <button
                onClick={startFallbackVideo}
                className="absolute top-4 left-4 z-50 text-xs bg-gray-900/80 hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700 backdrop-blur transition shadow-md cursor-pointer"
              >
                📹 Switch to Direct WebRTC Mode
              </button>
            </div>
          )}
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

              {/* Live interim (currently being spoken) */}
              {interimText && (
                <span className="transcript-interim text-gray-400 italic">
                  {' '}{interimText}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
