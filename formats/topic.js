import Embed from '../blots/embed';


class Topic extends Embed {
    static create(value) {
        let data = JSON.parse(value);

        const node = super.create(data.target_name);

        const contentNode = document.createElement('span');

        contentNode.innerHTML = "#" + data.target_name + "#";
        contentNode.setAttribute("style", "color:#1783ff");
        node.appendChild(contentNode);

        node.setAttribute('data-value', data.target_name);
        node.setAttribute("data-topic", data.target_id);

        return node;
    }

    static value(domNode) {
        let val = domNode.getAttribute('data-value');
        let id = domNode.getAttribute('data-topic');
        return {"topic_name": val, "topic_id": id};
    }

    html() {
        const {topic} = this.value();
        return `<span>#${topic.topic_name}#</span>`;
    }
}

Topic.blotName = 'topic';
Topic.className = 'ql-topic';
Topic.tagName = 'SPAN';


export default Topic;
