import LessonAudioPlayer from './LessonAudioPlayer.jsx';

export interface LessonAudioPlayerProps {
  src?: string;
  audioId?: string;
  lessonId?: string;
  title?: string;
  speaker?: string;
  initialPosition?: number;
  duration?: number;
  onProgressUpdate?: (progress: {
    lessonId: string;
    lastPosition: number;
    duration: number;
    percentage: number;
    completed: boolean;
  }) => void;
  onComplete?: (data: { lessonId: string; lastPosition: number; duration: number }) => void;
  className?: string;
  autoPlay?: boolean;
}

export default LessonAudioPlayer;
