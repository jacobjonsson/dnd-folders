import "./index.css";

const element = document.getElementById("dropZone");

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
  const items = evt.dataTransfer.items;
  const files = await getFiles(evt.dataTransfer);

  console.log({ files });

  document.getElementById("file-list").innerHTML = files
    .map(([file, fullPath]) => `<li>${file.name} - ${fullPath}</li>`)
    .join("\n");
});

async function getFiles(dataTransfer) {
  const files = [];
  for (let i = 0; i < dataTransfer.items.length; i++) {
    const item = dataTransfer.items[i];
    if (item.kind !== "file") {
      continue;
    }

    const entry = item.webkitGetAsEntry();
    const entryContent = await readEntryContentAsync(entry);
    files.push(...entryContent);
  }

  return files;
}

function readEntryContentAsync(entry) {
  return new Promise((resolve, reject) => {
    let reading = 0;
    const contents = [];

    readEntry(entry);

    function readEntry(entry) {
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

    function readReaderContent(reader) {
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

function isFile(entry) {
  return entry.isFile;
}

function isDirectory(entry) {
  return entry.isDirectory;
}
