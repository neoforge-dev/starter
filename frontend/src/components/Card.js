render() {
  return html`
    <div class="card">
      <slot></slot>
    </div>
  `;
}

getWrapper() {
  const wrapper = document.createElement(this.tagName);
  wrapper.className = 'card';
  return wrapper;
} 