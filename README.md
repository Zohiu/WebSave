# WebSave

<img src="./web/lib/img/icon.png" width="50" height="50"/>

A progressive web app that allows you to save websites locally for offline viewing.

## How?
You will be asked to grant permission to a local directory, which will then be used to store `.html` files created using [Single File](https://www.getsinglefile.com/). This only works on browsers that support [window.showDirectoryPicker()](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker) - At the time of writing this, those include Chrome, Edge, and Opera.

### Unsupported browsers
On unsupported browsers all saved websites get stored in the browser's `IndexedDB`. If installed as a progressive web app. This makes it hard to transfer data between devices because you don't have easy access to the files.

## Source code
Since most of the code was written in time for a deadline, there is a lot of room for improvement. There will likely be big changes in the future. 

The repository currently contains binaries for [single-file-cli](https://github.com/gildas-lormeau/single-file-cli), which will be removed in the future. They were included to create a full package because this is mainly a school project and I needed to hand in a full working version - preferably without external dependencies to make sure it works for the teacher.