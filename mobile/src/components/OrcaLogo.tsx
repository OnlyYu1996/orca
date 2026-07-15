import { Image } from 'react-native'

type Props = {
  size?: number
  color?: string
}

export function OrcaLogo({ size = 24 }: Props) {
  return (
    <Image
      source={require('../../assets/icon.png')}
      style={{ width: size, height: size, borderRadius: Math.max(2, Math.round(size * 0.18)) }}
      resizeMode="contain"
    />
  )
}
