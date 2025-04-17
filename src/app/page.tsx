"use client"

import { useCallback, useEffect, useState } from 'react';
import Terminal, { TerminalOutput } from 'react-terminal-ui';

import { socket } from "./socket";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState<string | null>(null);
  const [terminalLineData, setTerminalLineData] = useState([
    <TerminalOutput key={0}>Be careful not to run any malicious code</TerminalOutput>,
  ]);

  const addTerminalOutput = useCallback((content: React.ReactNode) => {
    setTerminalLineData((prevData) => [
      ...prevData,
      <TerminalOutput key={prevData.length}>{content}</TerminalOutput>
    ])
  }, [])

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport(null);
    }

    function onMessage(msg: string) {
      addTerminalOutput(msg)
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on('message', onMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off('message', onMessage);
    };
  }, []);

  const onTerminalInput = useCallback((terminalInput: string) => {
    addTerminalOutput(<>&#36;&nbsp;{terminalInput}</>)
    socket.emit('message', terminalInput)
  }, [addTerminalOutput])

  useEffect(() => {
    if (transport) {
      console.log(`Using %c${transport}`, 'background-color: yellow; font-weight: bold; color: black;', 'as a transport')
    } else {
      console.log('User is %cdisconnected', 'background-color: red; font-weight: bold; color: white;', 'from the WS server')
    }
  }, [transport])

  return (
    <div>
      <Terminal
        name="Run real terminal commands on the server machine"
        onInput={onTerminalInput}
      >
        {terminalLineData}
      </Terminal>
    </div>
  );
};
