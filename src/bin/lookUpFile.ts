import fs from 'fs';
import path from 'path';

type Result = {
  type: 'available',
  filePath: string;
} | {
  type: 'unavailable',
  filePathFromProjRoot: string;
} | {
  type: 'no-module'
}

const findFileAbsolutePath = (fileRelativePath: string): Result => {
  if (require.main) {
    return findStartingWith(path.dirname(require.main.filename), fileRelativePath);
  } else {
    return {
      type: 'no-module'
    }
  }
}

const findStartingWith = (dirAbsolutePath: string, fileRelativePath: string): Result => {
  const file = path.join(dirAbsolutePath, fileRelativePath);
  try {
    fs.statSync(file);
    return {
      type: 'available',
      filePath: file
    };
  } catch (err) {
    // They are equal for project root dir
    if (path.dirname(dirAbsolutePath) !== dirAbsolutePath) {
      return findStartingWith(path.dirname(dirAbsolutePath), fileRelativePath);
    } else {
      return {
        type: 'unavailable',
        filePathFromProjRoot: file
      }
    }
  }
}

const parse = (content: string) => {
  if (/^\s*{/.test(content)) {
    return JSON.parse(content);
  }
  return undefined;
}

file(...args) {
  const nonNullArgs = [].slice.call(args).filter(arg => arg != null);

  // path.join breaks if it's a not a string, so just skip this.
  for (let i = 0; i < nonNullArgs.length; i++) {
    if (typeof nonNullArgs[i] !== 'string') {
      return;
    }
  }

  const file = path.join.apply(null, nonNullArgs);
  try {
    return fs.readFileSync(file, 'utf-8');
  } catch (err) {
    return undefined;
  }
}

json(...args) {
  const content = file.apply(null, args);
  return content ? parse(content) : null;
}

// Find the rc file path
const rcPath = findFileAbsolutePath('.projectrc');
// Or
// const rcPath = find('/.config', '.projectrc');

// Read the contents as json
const rcObject = json(rcPath);
console.log(rcObject);