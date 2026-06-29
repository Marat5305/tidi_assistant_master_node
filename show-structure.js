// show-structure.js
// Запуск: node show-structure.js
// Показывает дерево папок и файлов в директории src

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация
const TARGET_DIR = path.join(__dirname, './src');
const IGNORED_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
const IGNORED_FILES = ['.DS_Store', '*.log', '*.lock', 'package-lock.json'];

const SYMBOLS = {
  BRANCH: '├── ',
  LAST_BRANCH: '└── ',
  INDENT: '│   ',
  EMPTY_INDENT: '    '
};

function shouldIgnore(name, isDirectory = false) {
  if (isDirectory) {
    return IGNORED_DIRS.includes(name);
  }
  return IGNORED_FILES.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(name);
    }
    return name === pattern;
  });
}

function buildTree(dirPath, prefix = '', isLast = true) {
  try {
    const items = fs.readdirSync(dirPath);
    
    let filteredItems = items.filter(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      return !shouldIgnore(item, stat.isDirectory());
    });
    
    const dirs = [];
    const files = [];
    
    filteredItems.forEach(item => {
      const fullPath = path.join(dirPath, item);
      if (fs.statSync(fullPath).isDirectory()) {
        dirs.push(item);
      } else {
        files.push(item);
      }
    });
    
    filteredItems = [...dirs.sort(), ...files.sort()];
    
    filteredItems.forEach((item, index) => {
      const isLastItem = index === filteredItems.length - 1;
      const fullPath = path.join(dirPath, item);
      const isDirectory = fs.statSync(fullPath).isDirectory();
      
      const currentPrefix = prefix + (isLast ? SYMBOLS.EMPTY_INDENT : SYMBOLS.INDENT);
      const linePrefix = prefix + (isLastItem ? SYMBOLS.LAST_BRANCH : SYMBOLS.BRANCH);
      
      const suffix = isDirectory ? '/' : '';
      console.log(linePrefix + item + suffix);
      
      if (isDirectory) {
        buildTree(fullPath, currentPrefix, isLastItem);
      }
    });
  } catch (error) {
    if (error.code !== 'EACCES' && error.code !== 'EPERM') {
      console.error(`Ошибка: ${error.message}`);
    }
  }
}

function main() {
  console.log('\n📁 ' + path.basename(TARGET_DIR) + '/');
  
  if (!fs.existsSync(TARGET_DIR)) {
    console.error(`\n❌ Папка "${TARGET_DIR}" не найдена!`);
    console.log(`💡 Убедитесь, что запускаете скрипт из корня проекта (где лежит package.json)\n`);
    process.exit(1);
  }
  
  try {
    const items = fs.readdirSync(TARGET_DIR);
    const filteredItems = items.filter(item => !shouldIgnore(item, true));
    
    filteredItems.forEach((item, index) => {
      const isLast = index === filteredItems.length - 1;
      const fullPath = path.join(TARGET_DIR, item);
      const isDirectory = fs.statSync(fullPath).isDirectory();
      const prefix = isLast ? SYMBOLS.EMPTY_INDENT : SYMBOLS.INDENT;
      const linePrefix = isLast ? SYMBOLS.LAST_BRANCH : SYMBOLS.BRANCH;
      const suffix = isDirectory ? '/' : '';
      
      console.log(linePrefix + item + suffix);
      
      if (isDirectory) {
        buildTree(fullPath, prefix, isLast);
      }
    });
    
    console.log('\n✅ Готово!\n');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

main();