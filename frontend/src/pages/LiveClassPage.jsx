import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SERVER_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function LiveClassPage() {
  const { roomName, id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [peers, setPeers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isWhiteboard, setIsWhiteboard] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const effectRan = useRef(false);
  const recordingCanvasRef = useRef(null);
  const compositorIntervalRef = useRef(null);
  const isWhiteboardRef = useRef(false);

  useEffect(() => {
    isWhiteboardRef.current = isWhiteboard;
  }, [isWhiteboard]);

  useEffect(() => {
    const rCanvas = document.createElement('canvas');
    rCanvas.width = 1280;
    rCanvas.height = 720;
    recordingCanvasRef.current = rCanvas;
  }, []);

  // Setup Socket & WebRTC
  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    socketRef.current = io(SERVER_URL);

    const initRoom = (stream) => {
      socketRef.current.emit('join-room', roomName, user._id, user.name);

      socketRef.current.on('user-connected', async (userId, name) => {
        toast(`${name} joined the class!`, { icon: '👋' });
        
        // Only existing users create the initial offer
        const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        if (stream) {
          stream.getTracks().forEach(track => peer.addTrack(track, stream));
        }

        peer.onicecandidate = e => {
          if (e.candidate) {
            socketRef.current.emit('signal', userId, e.candidate, user.name);
          }
        };

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socketRef.current.emit('signal', userId, offer, user.name);

        peersRef.current.push({ peerID: userId, peer, name });
        setPeers(p => [...p, { peerID: userId, peer, name }]);
      });

      socketRef.current.on('signal', async (senderId, signal, name) => {
        let item = peersRef.current.find(p => p.peerID === senderId);

        if (!item && signal.type === 'offer') {
          // New Peer sending an offer to us
          const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => peer.addTrack(track, localStreamRef.current));
          }

          peer.onicecandidate = e => {
            if (e.candidate) socketRef.current.emit('signal', senderId, e.candidate, user.name);
          };

          item = { peerID: senderId, peer, name };
          peersRef.current.push(item);
          setPeers(p => [...p, item]);
        }

        if (item) {
          try {
            if (signal.type === 'offer') {
              await item.peer.setRemoteDescription(new RTCSessionDescription(signal));
              const answer = await item.peer.createAnswer();
              await item.peer.setLocalDescription(answer);
              socketRef.current.emit('signal', senderId, answer, user.name);
            } else if (signal.type === 'answer') {
              await item.peer.setRemoteDescription(new RTCSessionDescription(signal));
            } else if (signal.candidate) {
              await item.peer.addIceCandidate(new RTCIceCandidate(signal));
            }
          } catch (err) {
            console.error('WebRTC Signaling Error:', err);
          }
        }
      });

      socketRef.current.on('user-disconnected', (userId) => {
        const item = peersRef.current.find(p => p.peerID === userId);
        if (item) {
          item.peer.close();
          const pArr = peersRef.current.filter(p => p.peerID !== userId);
          peersRef.current = pArr;
          setPeers(pArr);
        }
      });
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      localStreamRef.current = stream;
      if (userVideo.current) userVideo.current.srcObject = stream;
      initRoom(stream);
    }).catch(err => {
      toast.error('Failed to access camera and microphone. Joining as text/view only.');
      console.error(err);
      initRoom(null);
    });

    socketRef.current.off('createMessage'); // prevent double registers
    socketRef.current.on('createMessage', (message, author) => {
      console.log('Received message:', message, 'from author:', author);
      setMessages(p => [...p, { text: message, author }]);
    });

    socketRef.current.off('receiveEmoji');
    socketRef.current.on('receiveEmoji', (emoji, author) => {
      toast(`${author}: ${emoji}`, { duration: 2000 });
      setMessages(p => [...p, { text: emoji, author, isEmoji: true }]);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      peerCleanup();
    };
  }, [roomName]);

  const peerCleanup = () => {
     peersRef.current.forEach(p => p.peer.close());
     peersRef.current = [];
     setPeers([]);
  };

  // Whiteboard Socket Receiving
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.on('onDraw', (data) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(data.x0, data.y0);
      ctx.lineTo(data.x1, data.y1);
      ctx.strokeStyle = data.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();
    });

    socketRef.current.on('clear-board', () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    });
  }, []);

  // Media Controls
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  // Screen Sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = stream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        if (userVideo.current) userVideo.current.srcObject = stream;

        // Replace track for all existing connections
        peersRef.current.forEach(pObj => {
          const sender = pObj.peer.getSenders().find(s => s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Failed to share screen:', err);
        toast.error('Failed to share screen');
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (userVideo.current) userVideo.current.srcObject = localStreamRef.current;
      
      peersRef.current.forEach(pObj => {
        const sender = pObj.peer.getSenders().find(s => s.track.kind === 'video');
        if (sender && videoTrack) sender.replaceTrack(videoTrack);
      });
    }
    
    setIsScreenSharing(false);
  };

  // Recording feature
  const toggleRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      if (compositorIntervalRef.current) clearInterval(compositorIntervalRef.current);
      setIsRecording(false);
      toast.success('Recording saved to your device.');
    } else {
      recordedChunksRef.current = [];
      let streamToRecord;
      
      try {
        compositorIntervalRef.current = setInterval(() => {
           if (!recordingCanvasRef.current) return;
           const ctx = recordingCanvasRef.current.getContext('2d');
           // Fill background
           ctx.fillStyle = '#0f172a';
           ctx.fillRect(0, 0, 1280, 720);

           if (isWhiteboardRef.current && canvasRef.current) {
              ctx.drawImage(canvasRef.current, 0, 0, 1280, 720);
           } else if (!isWhiteboardRef.current) {
              const videoElements = document.querySelectorAll('video');
              const validVideos = Array.from(videoElements).filter(v => v.readyState >= 2);
              
              if (validVideos.length > 0) {
                 const cols = Math.ceil(Math.sqrt(validVideos.length));
                 const rows = Math.ceil(validVideos.length / cols);
                 const cellW = 1280 / cols;
                 const cellH = 720 / rows;
                 
                 validVideos.forEach((v, index) => {
                    const c = index % cols;
                    const r = Math.floor(index / cols);
                    
                    const vw = v.videoWidth;
                    const vh = v.videoHeight;
                    if (vw > 0 && vh > 0) {
                       const scale = Math.min(cellW / vw, cellH / vh);
                       const dw = vw * scale;
                       const dh = vh * scale;
                       const dx = (c * cellW) + (cellW - dw) / 2;
                       const dy = (r * cellH) + (cellH - dh) / 2;
                       ctx.drawImage(v, dx, dy, dw, dh);
                    }
                 });
              }
           }
        }, 1000 / 30); // 30 FPS

        streamToRecord = recordingCanvasRef.current.captureStream(30);

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const destination = audioCtx.createMediaStreamDestination();

        if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
           const localSource = audioCtx.createMediaStreamSource(new MediaStream([localStreamRef.current.getAudioTracks()[0]]));
           localSource.connect(destination);
        }

        peersRef.current.forEach(pObj => {
           const remoteStream = pObj.peer.getRemoteStreams()[0];
           if (remoteStream && remoteStream.getAudioTracks().length > 0) {
               const remoteSource = audioCtx.createMediaStreamSource(new MediaStream([remoteStream.getAudioTracks()[0]]));
               remoteSource.connect(destination);
           }
        });

        const outAudioTrack = destination.stream.getAudioTracks()[0];
        if (outAudioTrack) {
           streamToRecord.addTrack(outAudioTrack);
        }

        if (!streamToRecord || streamToRecord.getTracks().length === 0) {
          toast.error('No stream to record.');
          if (compositorIntervalRef.current) clearInterval(compositorIntervalRef.current);
          return;
        }

        const mediaRecorder = new MediaRecorder(streamToRecord, { mimeType: 'video/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = e => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `Class_Recording_${new Date().getTime()}.webm`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          
          if (compositorIntervalRef.current) clearInterval(compositorIntervalRef.current);
          streamToRecord.getTracks().forEach(t => t.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        toast.success('Recording started...');

      } catch (err) {
         if (compositorIntervalRef.current) clearInterval(compositorIntervalRef.current);
         toast.error('Failed to capture stream for recording');
         return;
      }
    }
  };

  // Chat
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    console.log('Sending message:', newMessage);
    socketRef.current.emit('message', newMessage);
    setNewMessage('');
  };

  const sendEmoji = (emoji) => {
    socketRef.current.emit('emoji', emoji);
  };

  const handleEndCall = () => {
    navigate(`/${user.role}/class/${id}`);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pt-4 px-4 pb-20 relative min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 bg-slate-800 p-4 rounded-xl shadow-lg ring-1 ring-white/10">
          <h2 className="text-xl font-bold truncate pr-4">Live Session: {roomName.split('-')[roomName.split('-').length - 1]}</h2>
          {isRecording && <span className="flex items-center gap-2 text-red-500 font-semibold animate-pulse whitespace-nowrap"><span className="w-3 h-3 bg-red-500 rounded-full"></span>Recording</span>}
        </div>

        {/* Video / Whiteboard View */}
        <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden relative shadow-2xl ring-1 ring-white/5 flex items-center justify-center">
          {isWhiteboard ? (
            <Whiteboard canvasRef={canvasRef} socketRef={socketRef} />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 p-4 w-full h-full auto-rows-fr">
              <div className="relative rounded-xl overflow-hidden bg-slate-800 shadow-lg">
                <video ref={userVideo} muted autoPlay playsInline className="w-full h-full object-cover" />
                <span className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 text-sm rounded-lg backdrop-blur-sm">You ({user?.name})</span>
              </div>
              {peers.map((peerObj, index) => (
                <Video peer={peerObj.peer} name={peerObj.name} key={index} />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-800/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl ring-1 ring-white/10 z-50 transition-all hover:bg-slate-800 overflow-x-auto max-w-full">
          <button onClick={toggleMute} className={`p-4 rounded-xl transition-all ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}`} title="Mute/Unmute">
            {isMuted ? '🔇' : '🎤'}
          </button>
          <button onClick={toggleVideo} className={`p-4 rounded-xl transition-all ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}`} title="Turn Video On/Off">
            {isVideoOff ? '🚫📷' : '📷'}
          </button>
          <button onClick={toggleScreenShare} className={`p-4 rounded-xl transition-all ${isScreenSharing ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-700 hover:bg-slate-600'}`} title="Share your Screen">
            🖥️ {isScreenSharing ? 'Stop' : 'Share'}
          </button>
          <button onClick={() => setIsWhiteboard(!isWhiteboard)} className={`p-4 rounded-xl transition-all flex-shrink-0 whitespace-nowrap ${isWhiteboard ? 'bg-primary-500 hover:bg-primary-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
            🖌️ Board
          </button>
          <button onClick={toggleRecord} className={`p-4 rounded-xl transition-all flex-shrink-0 whitespace-nowrap ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-700 hover:bg-slate-600'}`}>
            ⏺️ Record
          </button>
          <button onClick={handleEndCall} className="p-4 rounded-xl bg-red-500 hover:bg-red-600 transition-all font-bold px-6 ml-4 flex-shrink-0 whitespace-nowrap">
            End Call
          </button>
        </div>
      </div>

      {/* Right Sidebar: Chat & Reactions */}
      <div className="w-80 bg-slate-800 flex flex-col border-l border-white/10 flex-shrink-0 max-w-[30vw]">
        <div className="p-4 border-b border-white/10 text-center font-bold text-lg">
          Chat & Reactions
        </div>

        {/* Emoji Bar */}
        <div className="flex items-center justify-around p-3 bg-slate-700/50">
          {['👏', '🤔', '😂', '👍', '🎉', '❤️'].map(emoji => (
            <button key={emoji} onClick={() => sendEmoji(emoji)} className="text-xl hover:scale-125 transition-transform">
              {emoji}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.author === user.name ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-slate-400 mb-1">{m.author}</span>
              <div className={`px-4 py-2 rounded-2xl max-w-[90%] break-words ${m.isEmoji ? 'text-4xl bg-transparent' : m.author === user.name ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-200'}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-slate-800">
          <div className="flex gap-2">
            <input type="text" className="w-full bg-slate-700 text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500 placeholder-slate-400"
              placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />
            <button type="submit" className="bg-primary-500 hover:bg-primary-600 px-4 rounded-xl transition-colors">
              ➤
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Child Component for Peer WebRTC Video
const Video = ({ peer, name }) => {
  const ref = useRef();
  
  useEffect(() => {
    peer.ontrack = e => {
      if (ref.current) ref.current.srcObject = e.streams[0];
    };
  }, [peer]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-slate-800 shadow-lg">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
      <span className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 text-sm rounded-lg backdrop-blur-sm">{name}</span>
    </div>
  );
};

// Child Component for Real-time Whiteboard
const Whiteboard = ({ canvasRef, socketRef }) => {
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const current = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }, []);

  const drawLine = (x0, y0, x1, y1, emmit) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    if (!emmit) return;
    socketRef.current.emit('draw', { x0, y0, x1, y1, color });
  };

  const onMouseDown = (e) => {
    setDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    current.current.x = e.clientX - rect.left;
    current.current.y = e.clientY - rect.top;
  };

  const onMouseUp = (e) => {
    if (!drawing) return;
    setDrawing(false);
    const rect = canvasRef.current.getBoundingClientRect();
    drawLine(current.current.x, current.current.y, e.clientX - rect.left, e.clientY - rect.top, true);
  };

  const onMouseMove = (e) => {
    if (!drawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    drawLine(current.current.x, current.current.y, e.clientX - rect.left, e.clientY - rect.top, true);
    current.current.x = e.clientX - rect.left;
    current.current.y = e.clientY - rect.top;
  };

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 flex gap-2 z-10 bg-slate-800/80 p-2 rounded-xl backdrop-blur-sm">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
        <button onClick={() => {
            const canvas = canvasRef.current;
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            socketRef.current.emit('clear-board');
        }} className="bg-red-500 hover:bg-red-600 px-3 py-1 text-xs rounded-lg font-bold">Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseOut={onMouseUp}
        onMouseMove={onMouseMove}
        className="w-full h-full cursor-crosshair bg-slate-900"
      />
    </div>
  );
};
