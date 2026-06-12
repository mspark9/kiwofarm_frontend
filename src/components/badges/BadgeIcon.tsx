// 뱃지 아이콘. emoji 필드는 이제 유니코드가 아닌 public svg 경로(/svg/badge/<id>.svg).
// inline=true 면 Badge/Text 안에 글자처럼 끼워 넣고, 미달성은 grayscale 로 흐리게.

import { Box } from "@mantine/core";

export function BadgeIcon({
  src,
  size,
  grayscale = false,
  inline = false,
}: {
  src: string;
  size: number;
  grayscale?: boolean;
  inline?: boolean;
}) {
  return (
    <Box
      component="img"
      src={src}
      alt=""
      w={size}
      h={size}
      style={{
        filter: grayscale ? "grayscale(1)" : undefined,
        display: inline ? "inline-block" : "block",
        verticalAlign: inline ? "text-bottom" : undefined,
        flexShrink: 0,
      }}
    />
  );
}
