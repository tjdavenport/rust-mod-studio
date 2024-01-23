const snippets = [];

for (const category of document.querySelectorAll('[list-template^="hook-rust-"]')) {
  for (const child of category.children) {
    snippets.push({
      category: category.getAttribute('list-template').replace('hook-rust-', '').replace('-view', ''),
      label: child.querySelector('h5').innerText,
      insertText: child.querySelector('pre').innerText,
      documentation: child.querySelector('ul').innerText
    });
  }
}

copy(JSON.stringify(snippets));
