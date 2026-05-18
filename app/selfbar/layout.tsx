import { QueueTickerProvider } from '@/components/queue/queue-ticker-provider';

export default function SelfbarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <QueueTickerProvider>{children}</QueueTickerProvider>;
}
