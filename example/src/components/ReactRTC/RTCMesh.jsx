import React, { Component } from 'react';
import RTCVideo from './RTCVideo.jsx';
import Form from './Form.jsx';
import Websocket from './Websocket.jsx';
import PeerConnection from './PeerConnection.jsx';
import { DEFAULT_CONSTRAINTS, DEFAULT_ICE_SERVERS, TYPE_ROOM } from './functions/constants';
import { buildServers, generateRoomKey } from './functions/utils';

class RTCMesh extends Component {
  constructor(props) {
    super(props);
    const {mediaConstraints, iceServers } = props;
    // build iceServers config for RTCPeerConnection
    const iceServerURLs = buildServers(iceServers);
    this.state = {
      iceServers: iceServerURLs || DEFAULT_ICE_SERVERS,
      mediaConstraints: mediaConstraints || DEFAULT_CONSTRAINTS,
      localMediaStream: null,
      remoteMediaStream: null,
      roomKey: null,
      connectionStarted: false,
      sendMessage: () => (console.log('websocket.send function has not been set')),
      text: '',
    };
  }

  openCamera = async () => {
    const { mediaConstraints, localMediaStream } = this.state;
    try {
      if (!localMediaStream) {
        const mediaStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        this.setState({ localMediaStream: mediaStream }, this.sendRoomKey);
      }
    } catch(error) {
      console.error('getUserMedia Error: ', error)
    }
  }

  /**
   * @param {function} websocketSendMethod
   * upon successful creation of new Websocket instance, RTCMesh will recieve
   * websocket's send function definition and store it in state
   */
  setSendMethod = (websocketSendMethod) => {
    console.log ('Inside SocketCreation: ', websocketSendMethod);
    this.setState({ sendMessage: websocketSendMethod });
  }

  sendRoomKey = () => {
    const { roomKey } = this.state;
    if (!roomKey) {
      const room = { type: TYPE_ROOM, roomKey: generateRoomKey() };
      this.setState({ roomKey: room })
      this.state.sendMessage(JSON.stringify(room));
      alert(room.roomKey);
    }
  }

  handleConnectionReady = (message) => {
    console.log('Inside handleConnectionReady: ', message);
    if (message.startConnection) {
      this.setState({ connectionStarted: message.startConnection });
    }
  }

  addRemoteStream = (remoteMediaStream) => {
    this.setState({ remoteMediaStream });
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const { text, roomKey } = this.state;
    // send the roomKey
    if (text.trim()) {
      const roomKeyMessage = JSON.stringify({
        type: TYPE_ROOM,
        roomKey: this.state.text
      });
      this.state.sendMessage(roomKeyMessage);
    };
    this.setState({ text: '' });
  }

  handleChange = (event) => {
    this.setState({
      text: event.target.value
    });
  }

  render() {
    const { 
      localMediaStream, 
      remoteMediaStream, 
      text, 
      roomKey, 
      iceServers,
      connectionStarted,
      sendMessage,
    } = this.state;
    return (
      <>
        <Websocket 
          url="wss://94a57304.ngrok.io" 
          setSendMethod={this.setSendMethod}
          handleConnectionReady={this.handleConnectionReady}
        />
        <PeerConnection
          iceServers={iceServers}
          localMediaStream={localMediaStream}
          addRemoteStream={this.addRemoteStream}
          startConnection={connectionStarted}
          sendMessage={sendMessage}
        />
        <RTCVideo mediaStream={localMediaStream} />
        <RTCVideo mediaStream={remoteMediaStream} />

        <Form
          handleSubmit={this.handleSubmit}
          handleChange={this.handleChange}
          hasRoomKey={roomKey}
          text={text}
        />

        <section className='button-container'>
          <div className='button button--start-color' onClick={this.openCamera}>
          </div>
          <div className='button button--stop-color' onClick={null}>
          </div>
        </section>
      </>
    );
  }
}

export default RTCMesh;