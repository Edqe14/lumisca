import { sessionStore } from '@/lib/stores/session-store';
import { cn } from '@/lib/utils';
import type { SessionMemberRTState } from '@/lib/validators/session';
import { ActionIcon, Card, CardSection, LoadingOverlay } from '@mantine/core';
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
import { Participant } from '@videosdk.live/react-sdk/dist/types/participant';
import { userStore } from '@/lib/stores/user-store';
import { MicVAD } from '@ricky0123/vad-web';

const ParticipantCell = ({
  id,
  participant,
  member,
}: {
  id: string;
  participant?: Participant;
  member: SessionMemberRTState;
}) => {
  const { session } = useSnapshot(sessionStore);
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
    if (micStream && !member?.isMuted) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(micStream.track);

      return mediaStream;
    }
  }, [micStream, member?.isMuted, isLocal]);

  useEffect(() => {
    if (!isLocal || !audioStream) return;

    // @ts-ignore
    const myvad = vad.MicVAD.new({
      stream: audioStream,
      onSpeechStart: async () => {
        if (!session || sessionStore.callState?.isSpeaking) return;

        await session.updateState(() => ({ isSpeaking: true }));
      },
      onSpeechEnd: async () => {
        if (!session || !sessionStore.callState?.isSpeaking) return;

        await session.updateState(() => ({ isSpeaking: false }));
      },
    });

    // @ts-ignore
    myvad.then((v) => v.start());

    return () => {
      // @ts-ignore
      myvad.then((v) => v.destroy?.());
    };
  }, [isLocal, audioStream]);

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
      className="w-80 aspect-video relative grid place-items-center group"
    >
      {member?.isCamEnabled && (
        <CardSection>
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
        </CardSection>
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

      {member?.isMuted && (
        <div className="bg-zinc-300/20 text-zinc-700 px-2 py-1 absolute rounded top-1 right-1">
          <IconMicrophoneOff size={16} className="text-red-500" />
        </div>
      )}

      <p className="text-sm bg-zinc-100/80 text-zinc-700 px-2 py-1 rounded absolute right-1 bottom-1 group-hover:opacity-100 opacity-30 transition-opacity duration-200">
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
  const { profile } = useSnapshot(userStore);
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
      setTimeout(() => {
        sessionStore.callStatus = 'JOINING';
        join();
      }, 500);
    }
  }, [session, callToken]);

  const participantMap = useMemo(() => {
    const map = new Map<string, Participant>();

    participants.forEach((participant) => {
      map.set(participant.id, participant);
    });

    return map;
  }, [participants]);

  return (
    <Card withBorder className="col-span-2 relative grid place-items-center">
      {callStatus === 'JOINING' && (
        <LoadingOverlay visible loaderProps={{ size: 20 }} />
      )}
      {callStatus === 'JOINED' && (
        <>
          <CallControls />

          <section className="flex flex-wrap items-center justify-center gap-2">
            {Object.values(memberStates).map((member) => (
              <ParticipantCell
                key={member.id}
                id={member.id}
                participant={participantMap.get(member.id)}
                member={member}
              />
            ))}
          </section>
        </>
      )}
    </Card>
  );
};
