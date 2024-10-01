import { sessionStore } from '@/lib/stores/session-store';
import { cn } from '@/lib/utils';
import type { SessionMemberRTState } from '@/lib/validators/session';
import { ActionIcon, Card, LoadingOverlay } from '@mantine/core';
import {
  IconCamera,
  IconCameraOff,
  IconDoorExit,
  IconMicrophone,
  IconMicrophoneOff,
} from '@tabler/icons-react';
import { useMeeting, useParticipant } from '@videosdk.live/react-sdk';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef } from 'react';
import { useSnapshot } from 'valtio';
import ReactPlayer from 'react-player';
import React from 'react';

const ParticipantCell = ({
  id,
  member,
}: {
  id: string;
  member?: SessionMemberRTState;
}) => {
  const { webcamStream, micStream, isLocal } = useParticipant(id);
  const micRef = useRef<HTMLAudioElement>(null);

  const videoStream = useMemo(() => {
    if (webcamStream && member?.isCamEnabled) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);

      return mediaStream;
    }
  }, [webcamStream, member?.isCamEnabled]);

  const audioStream = useMemo(() => {
    if (micStream && !member?.isMuted && !isLocal) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(micStream.track);

      return mediaStream;
    }
  }, [micStream, member?.isMuted, isLocal]);

  useEffect(() => {
    if (!micRef.current) return;
    if (member?.isMuted || !audioStream) {
      micRef.current.srcObject = null;
      return;
    }

    micRef.current.srcObject = audioStream;
    micRef.current.play();

    return () => {
      if (micRef.current) {
        micRef.current.srcObject = null;
      }
    };
  }, [audioStream, micRef.current, member?.isMuted]);

  return (
    <Card
      withBorder
      radius="md"
      key={member?.id}
      className="min-w-64 aspect-video relative grid place-items-center group"
    >
      {member?.isCamEnabled && (
        <ReactPlayer
          playsinline
          pip={false}
          light={false}
          controls={false}
          muted={true}
          playing={true}
          url={videoStream}
          onError={(err) => {
            console.log(err, 'participant video error');
          }}
          width="100%"
          height="100%"
        />
      )}

      {!member?.isCamEnabled && (
        <img
          className={cn(
            'w-20 rounded-full ring-0 transition-all duration-150',
            member?.isSpeaking && 'ring-4 ring-green-500/60'
          )}
          src={
            member?.profilePict ||
            `https://api.dicebear.com/9.x/glass/svg?seed=${member?.name}`
          }
        />
      )}

      <p className="text-sm bg-zinc-500/10 text-zinc-700 px-2 py-1 rounded absolute right-1 bottom-1 group-hover:opacity-100 opacity-30 transition-opacity duration-200">
        {member?.name}
      </p>

      <audio ref={micRef} autoPlay muted={isLocal} />
    </Card>
  );
};

const CallControls = () => {
  const router = useRouter();
  const { session, callState } = useSnapshot(sessionStore);
  const { leave, toggleMic, toggleWebcam, toggleScreenShare } = useMeeting();

  if (!session) return null;

  const leaveCall = async () => {
    leave();
    sessionStore.callStatus = 'IDLE';
    await session.reset();

    router.push('/app');
  };

  const toggleMute = async () => {
    await session.updateState(({ isMuted }) => ({ isMuted: !isMuted }));
    toggleMic();
  };

  const toggleCam = async () => {
    await session.updateState(({ isCamEnabled }) => ({
      isCamEnabled: !isCamEnabled,
    }));
    toggleWebcam();
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
      <ActionIcon color="red" size="xl" variant="light" onClick={leaveCall}>
        <IconDoorExit size={24} />
      </ActionIcon>

      <ActionIcon
        color="dark"
        variant={callState?.isMuted ? 'filled' : 'outline'}
        onClick={toggleMute}
        size="xl"
      >
        {callState?.isMuted ? (
          <IconMicrophoneOff size={24} />
        ) : (
          <IconMicrophone size={24} />
        )}
      </ActionIcon>

      <ActionIcon
        color="dark"
        variant={!callState?.isCamEnabled ? 'filled' : 'outline'}
        onClick={toggleCam}
        size="xl"
      >
        {callState?.isCamEnabled ? (
          <IconCamera size={24} />
        ) : (
          <IconCameraOff size={24} />
        )}
      </ActionIcon>
    </div>
  );
};

export const SessionCall = () => {
  const { memberStates, session, callStatus, callToken } =
    useSnapshot(sessionStore);
  const { join, participants } = useMeeting({
    onMeetingJoined: () => {
      sessionStore.callStatus = 'JOINED';
    },
    onMeetingLeft: () => {
      session?.reset();
    },
  });

  useEffect(() => {
    if (session && callStatus === 'IDLE' && callToken) {
      join();
      sessionStore.callStatus = 'JOINING';
    }
  }, []);

  return (
    <Card withBorder className="col-span-2 relative">
      {callStatus === 'JOINING' && (
        <LoadingOverlay visible loaderProps={{ size: 20 }} />
      )}
      {callStatus === 'JOINED' && (
        <>
          <CallControls />

          <section className="flex flex-wrap items-center justify-center flex-grow">
            {[...participants.keys()].map((id) => (
              <ParticipantCell key={id} id={id} member={memberStates[id]} />
            ))}
          </section>
        </>
      )}
    </Card>
  );
};
