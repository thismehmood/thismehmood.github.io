'use client';

import { useEffect, useState } from 'react';
import { site } from '@/lib/data';

/**
 * Live local time in Lahore (PKT). Renders a placeholder on the server and
 * fills in after mount, so server and client HTML always match.
 */
export default function LocalTime({ className }: { className?: string }) {
  const [time, setTime] = useState('--:--');

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: site.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  return <time className={className}>{time}</time>;
}
