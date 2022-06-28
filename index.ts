import "./index.css";

const element = document.getElementById("dropZone") as HTMLDivElement;
const fileList = document.getElementById("file-list") as HTMLUListElement;

[
  "dragenter",
  "dragstart",
  "dragend",
  "dragleave",
  "dragover",
  "drag",
  "drop",
].forEach((evt) => {
  element.addEventListener(evt, (event) => {
    event.preventDefault();
  });
});

element.addEventListener("drop", async (evt) => {
  const files = await getFilesAsync(evt.dataTransfer!);

  fileList.innerHTML = files
    .map(([file, fullPath]) => `<li>${file.name} - ${fullPath}</li>`)
    .join("\n");
});

async function getFilesAsync(dataTransfer: DataTransfer) {
  const files: [File, string][] = [];
  for (let i = 0; i < dataTransfer.items.length; i++) {
    const item = dataTransfer.items[i];
    if (item.kind === "file") {
      if (typeof item.webkitGetAsEntry === "function") {
        const entry = item.webkitGetAsEntry();
        const entryContent = await readEntryContentAsync(entry!);
        files.push(...entryContent);
        continue;
      }

      const file = item.getAsFile();
      if (file) {
        files.push([file, file.webkitRelativePath]);
      }
    }
  }

  return files;
}

function readEntryContentAsync(entry: FileSystemEntry) {
  return new Promise<[File, string][]>((resolve, reject) => {
    let reading = 0;
    const contents: [File, string][] = [];

    readEntry(entry);

    function readEntry(entry: FileSystemEntry) {
      if (isFile(entry)) {
        reading++;
        entry.file((file) => {
          reading--;
          contents.push([file, entry.fullPath]);

          if (reading === 0) {
            resolve(contents);
          }
        });
      } else if (isDirectory(entry)) {
        readReaderContent(entry.createReader());
      }
    }

    function readReaderContent(reader: FileSystemDirectoryReader) {
      reading++;

      reader.readEntries(function (entries) {
        reading--;
        for (const entry of entries) {
          readEntry(entry);
        }

        if (reading === 0) {
          resolve(contents);
        }
      });
    }
  });
}

function isDirectory(
  entry: FileSystemEntry
): entry is FileSystemDirectoryEntry {
  return entry.isDirectory;
}

function isFile(entry: FileSystemEntry): entry is FileSystemFileEntry {
  return entry.isFile;
}
