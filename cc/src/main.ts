import * as event from './event';

print('Starting CC-SSH agent!');
sleep(0.5);
term.setCursorPos(0, 0);
term.setBackgroundColor(colors.blue);
term.setTextColor(colors.white);
term.clear();
const [width, height] = term.getSize();

function centerWrite(text: string, additionalY?: number): void {
  term.setCursorPos(Math.floor(width / 2) - Math.floor(text.length), Math.floor(height / 2) + additionalY || 0);
  term.write(text);
}

centerWrite('CC-SSH');
centerWrite('Connected!', 1);
