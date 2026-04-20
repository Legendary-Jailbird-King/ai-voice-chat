interface Props {
  src?: string;
}

export default function AudioPlayer({ src }: Props) {
  if (!src) return null;
  return <audio src={src} controls />;
}
