interface SocialButtonProps {
  provider: 'google' | 'github' | 'microsoft';
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}

export default function SocialButton({ provider, label, disabled, onClick }: SocialButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 relative group cursor-pointer"
      title={disabled ? 'Coming soon' : `Sign in with ${label}`}
    >
      <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-gray-100 rounded text-gray-500">
        {provider[0].toUpperCase()}
      </span>
      Continue with {label}
      {disabled && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          Coming soon
        </span>
      )}
    </button>
  );
}
