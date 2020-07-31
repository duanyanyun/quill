import Embed from '../blots/embed';


class Emoji extends Embed {
    static create(value) {
        let data = JSON.parse(value);
        const node = super.create(data.title);

        let img = document.createElement("img");
        node.setAttribute("title", data.title);
        node.setAttribute("data-url", data.src);
        node.setAttribute("data-type", data.type);
        img.src = "https://img.guibi.com/emot/qq/" + data.src;
        node.appendChild(img);
        return node;
    }

    static value(domNode) {
        let title = domNode.getAttribute('title');
        let url = domNode.getAttribute('data-url');
        let type = domNode.getAttribute('data-type');
        return {"title": title, "src": url,"type":type};
    }

    html() {
         const {model} = this.value();
        return `<img title="${model.title}"  src="https://img.guibi.com/emot/qq/${model.src}">`;
    }
}

Emoji.blotName = 'emoji';
Emoji.className = 'ql-emoji';
Emoji.tagName = 'SPAN';


export default Emoji;
