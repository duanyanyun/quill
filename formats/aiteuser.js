import Embed from '../blots/embed';


class Aiteuser extends Embed {
    static create(value) {
        let data = JSON.parse(value);

        const node = super.create(data.target_name);
        const contentNode = document.createElement('span');
        contentNode.innerHTML = "@" + data.target_name;
        contentNode.setAttribute("style", "color:#1783ff");
        node.appendChild(contentNode);
        node.setAttribute('data-value', data.target_name);
        node.setAttribute("data-user", data.target_id);

        return node;
    }

    static value(domNode) {
        let val = domNode.getAttribute('data-value');
        let id = domNode.getAttribute('data-user');
        return {"user_name": val, "user_id": id};
    }

    html() {
        const {user} = this.value();
        return `<span>@${user.user_name}</span>`;
    }
}

Aiteuser.blotName = 'aiteuser';
Aiteuser.className = 'ql-aiteuser';
Aiteuser.tagName = 'SPAN';


export default Aiteuser;
