const fs = require('fs');
const path = require('path');

const filePath = 'client/src/components/shared/sidebar.tsx';
const fileContent = fs.readFileSync(filePath, 'utf8');

// 정규식을 사용하여 <Link><a>...</a></Link> 패턴을 <Link>...</Link>로 변환
const fixedContent = fileContent.replace(
  /<Link href="([^"]+)">\s*<a className={cn\(\s*"([^"]+)",\s*([^)]+)\)}>([^<]*?)<\/a>\s*<\/Link>/g,
  '<Link href="$1" className={cn("$2", $3)}>$4</Link>'
);

fs.writeFileSync(filePath, fixedContent);
console.log('Links fixed successfully');
