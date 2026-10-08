import LessonVideoPlayer from './LessonVideoPlayer.jsx';

export interface LessonVideoPlayerProps {
  src?: string;
  videoId?: string;
  lessonId?: string;
  title?: string;
  poster?: string;
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

export default LessonVideoPlayer;
