import type { ReactNode } from 'react';

type Props = { href: string; variant?: 'primary' | 'ghost'; external?: boolean; children: ReactNode };

export function Button({ href, variant = 'ghost', external, children }: Props) {
  return (
    <a
      className={`btn btn--${variant}`}
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener' } : {})}
    >
      {children}
    </a>
  );
}
