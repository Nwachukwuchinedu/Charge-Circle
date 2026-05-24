interface LoadingSpinnerProps {
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ text = 'Loading', fullScreen = false }: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-indigo-400 font-mono text-sm">{text}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#060709] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
