'use client';

import { useEffect } from 'react';
import StringTune from '@fiddle-digital/string-tune';

export default function StringTuneProvider() {
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_STRINGTUNE_DEV_TOKEN;
    if (token) {
      StringTune.getInstance().accessDevtoolToken = token;
    }
  }, []);

  return null;
}
