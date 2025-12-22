/**
 * Shared component for displaying empty state messages
 */

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="text-sm text-gray-500 text-center py-4">
      {message}
    </div>
  );
}
