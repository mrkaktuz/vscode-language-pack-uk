const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const newSrcDir = 'new_ru/translations/',
      oldSrcDir = 'old_ru/translations/',
      destDir = 'translations/',
      newPackageJson = 'new_ru/package.json';

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

class ProgressLogger {
    constructor(total) {
        this.total = total;
        this.current = 0;
        this.startTime = Date.now();
        this.fileStartTime = null;
        this.lastProgressUpdate = null;
        this.totalStringsInCurrentFile = 0;
        this.processedStringsInCurrentFile = 0;
    }

    startFile(filename, fileNumber) {
        this.fileStartTime = Date.now();
        this.lastProgressUpdate = Date.now();
        this.totalStringsInCurrentFile = 0;
        this.processedStringsInCurrentFile = 0;
        console.log(`Processing file ${filename} (${fileNumber}/${this.total})`);
    }

    setFileStringCount(count) {
        this.totalStringsInCurrentFile = count;
    }

    incrementProcessedStrings() {
        this.processedStringsInCurrentFile++;
        
        const now = Date.now();
        if (this.totalStringsInCurrentFile > 0 && now - this.lastProgressUpdate >= 2500) {
            const elapsedSeconds = (now - this.fileStartTime) / 1000;
            const percentComplete = this.processedStringsInCurrentFile / this.totalStringsInCurrentFile;
            
            if (percentComplete > 0 && percentComplete < 1) {
                const estimatedTotalSeconds = elapsedSeconds / percentComplete;
                const remainingSeconds = Math.max(0, estimatedTotalSeconds - elapsedSeconds);
                
                console.log(`Progress: ${Math.round(percentComplete * 100)}% (${this.processedStringsInCurrentFile}/${this.totalStringsInCurrentFile}), ETA: ${formatTime(Math.round(remainingSeconds))}, Elapsed: ${formatTime(Math.round(elapsedSeconds))}`);

                //process.stdout.write(`\rProgress: ${Math.round(percentComplete * 100)}% (${this.processedStringsInCurrentFile}/${this.totalStringsInCurrentFile}), ETA: ${formatTime(Math.round(remainingSeconds))}, Elapsed: ${formatTime(Math.round(elapsedSeconds))}${' '.repeat(20)}`);
                
                this.lastProgressUpdate = now;
            }
        }
    }

    finishFile(filename, hadChanges) {
        if (hadChanges) {
            const totalElapsed = Math.round((Date.now() - this.startTime) / 1000);
            const fileElapsed = Math.round((Date.now() - this.fileStartTime) / 1000);
            
            console.log(`Completed ${filename}`);
            //process.stdout.write(`\rCompleted ${filename}${' '.repeat(20)}\n`);
            console.log(`Time: ${formatTime(fileElapsed)} (total: ${formatTime(totalElapsed)})`);
        }
    }
}

async function translate(text) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a helpful translator. Translate the given text into Ukrainian. The input consists of strings from a software application, so preserve all variables, technical terms, and special symbols without modification.' },
                { role: 'user', content: text }
            ]
        });
    
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Translation error:', error.response?.data || error.message);
        return text;
    }
}

async function cleanDirectory(dir) {
    try {
        await fs.rm(dir, { recursive: true });
    } catch (e) {
        // Directory doesn't exist, ignore
    }
    await fs.mkdir(dir, { recursive: true });
}

async function getAllJsonFiles(dir) {
    const files = [];
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            files.push(...await getAllJsonFiles(fullPath));
        } else if (item.isFile() && path.extname(fullPath) === '.json') {
            files.push(fullPath);
        }
    }
    return files;
}

function getRelativePath(fullPath, baseDir) {
    return path.relative(baseDir, fullPath);
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function readJsonFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
}

async function writeJsonFile(filePath, data) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, '\t'), 'utf8');
}

async function appendToReport(reportPath, content) {
    await fs.appendFile(reportPath, content + '\n', 'utf8');
}

function compareValues(newVal, oldVal) {
    if (typeof newVal !== 'object' || newVal === null) {
        return newVal !== oldVal;
    }
    return false;
}

function countStringsRecursively(obj) {
    let count = 0;
    
    if (typeof obj === 'string') {
        return 1;
    }
    
    if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
            count += countStringsRecursively(value);
        }
    }
    
    return count;
}

async function translateObject(obj, progress) {
    if (typeof obj !== 'object' || obj === null) {
        if (typeof obj === 'string') {
            const result = await translate(obj);
            if (progress) progress.incrementProcessedStrings();
            return result;
        }
        return obj;
    }

    const result = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = await translateObject(value, progress);
    }
    return result;
}

async function processContents(newObj, oldObj = {}, destObj = {}, path = [], changes = { changed: [], new: [] }, progress = null) {
    const processValue = async (value, key, currentPath) => {
        const pathStr = currentPath.join('.');

        if (typeof value === 'object' && value !== null) {
            destObj[key] = destObj[key] || (Array.isArray(value) ? [] : {});
            await processContents(value, oldObj[key] || {}, destObj[key], currentPath, changes, progress);
        } else if (typeof value === 'string') {
            if (key in oldObj && compareValues(value, oldObj[key])) {
                destObj[key] = await translate(value);
                if (progress) progress.incrementProcessedStrings();
                changes.changed.push({ 
                    path: pathStr, 
                    oldValue: oldObj[key], 
                    newValue: value,
                    translatedValue: destObj[key]
                });
            } else if (!(key in destObj)) {
                destObj[key] = await translate(value);
                if (progress) progress.incrementProcessedStrings();
                changes.new.push({ 
                    path: pathStr, 
                    value,
                    translatedValue: destObj[key]
                });
            } else {
                if (progress) progress.incrementProcessedStrings();
            }
        }
    };

    for (const [key, value] of Object.entries(newObj)) {
        await processValue(value, key, [...path, key]);
    }

    return changes;
}

async function main() {
    console.log('Starting file synchronization process...');
    
    console.log('Cleaning update_report directory...');
    await cleanDirectory('./update_report');
    
    console.log('Scanning directories...');
    const newFiles = await getAllJsonFiles(newSrcDir);
    console.log(`Found ${newFiles.length} files to process\n`);

    const progress = new ProgressLogger(newFiles.length);
    let fileNumber = 0;

    // Крок 1: Копіювання відсутніх файлів
    console.log('Checking for new files to copy...');
    for (const newFile of newFiles) {
        fileNumber++;
        const relPath = getRelativePath(newFile, newSrcDir);
        const destPath = path.join(destDir, relPath);
        
        const exists = await fileExists(destPath);
        if (!exists) {
            progress.startFile(relPath, fileNumber);
            
            const newData = await readJsonFile(newFile);
            const stringCount = countStringsRecursively(newData.contents || {});
            progress.setFileStringCount(stringCount);
            
            const translatedData = {
                ...newData,
                contents: await translateObject(newData.contents || {}, progress)
            };
            
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            await writeJsonFile(destPath, translatedData);
            await appendToReport('./update_report/new_files.txt', `Copied and translated: ${relPath}`);
            
            progress.finishFile(relPath, true);
        }
    }

    // Крок 2: Обробка вмісту файлів
    console.log('\nProcessing file contents...');
    fileNumber = 0;
    for (const newFile of newFiles) {
        fileNumber++;
        const relPath = getRelativePath(newFile, newSrcDir);
        const oldPath = path.join(oldSrcDir, relPath);
        const destPath = path.join(destDir, relPath);

        let oldData = {};
        try {
            oldData = await readJsonFile(oldPath);
        } catch (e) {
            continue;
        }

        const newData = await readJsonFile(newFile);
        let destData = {};
        try {
            destData = await readJsonFile(destPath);
        } catch (e) {
            destData = { contents: {} };
        }
        
        // Перевіряємо, чи є що обробляти
        const stringCount = countStringsRecursively(newData.contents || {});
        if (stringCount === 0) continue;
        
        progress.startFile(relPath, fileNumber);
        progress.setFileStringCount(stringCount);

        const changes = await processContents(
            newData.contents || {},
            oldData.contents || {},
            destData.contents || {},
            [],
            { changed: [], new: [] },
            progress
        );

        const hasChanges = changes.new.length > 0 || changes.changed.length > 0;
        
        if (hasChanges) {
            await writeJsonFile(destPath, {
                ...destData,
                contents: destData.contents
            });

            for (const change of changes.changed) {
                await appendToReport(
                    './update_report/changed_strings.txt',
                    `File: ${relPath}\nPath: ${change.path}\nOld: ${change.oldValue}\nNew: ${change.newValue}\nTranslated: ${change.translatedValue}\n`
                );
            }

            for (const newItem of changes.new) {
                await appendToReport(
                    './update_report/new_strings.txt',
                    `File: ${relPath}\nPath: ${newItem.path}\nValue: ${newItem.value}\nTranslated: ${newItem.translatedValue}\n`
                );
            }
        }

        progress.finishFile(relPath, hasChanges);
    }

    console.log('\nProcessing package.json');
    const newPack = await readJsonFile(newPackageJson);
    const curPack = await readJsonFile('./package.json');

    if (curPack.engines.vscode != newPack.engines.vscode) {
        console.log(`New VSCode version: ${newPack.engines.vscode}`);
    }
    curPack.engines.vscode = newPack.engines.vscode;
    curPack.contributes.localizations[0].translations = newPack.contributes.localizations[0].translations;

    const v = curPack.version.split('.').map(Number);
    v[1] += 1;
    curPack.version = v.join('.');

    await writeJsonFile('./package.json', curPack);

    const totalTime = Math.round((Date.now() - progress.startTime) / 1000);
    console.log(`\nProcess completed in ${formatTime(totalTime)}`);
}

main().catch(error => {
    console.error('Error occurred:', error);
    process.exit(1);
});