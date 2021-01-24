'use strict';

const nameInput = $('#name');
const channelInput = $('#channel-id');
const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const channelForm = document.querySelector('#channelForm');
const messageInput = document.querySelector('#message');
const channelCreateInput = document.querySelector('#channel');
const messageArea = document.querySelector('#messageArea');
const connectingElement = document.querySelector('.connecting');
const channelIdDisplay = document.querySelector('#channel-id-display');
const channelList = document.querySelector('#channel-list');

let stompClient = null;
let currentSubscription;
let username = null;
let channelId = null;
let topic = null;

const colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function connect(event) {
    username = nameInput.val().trim();
    Cookies.set('name', username);
    if (username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}

// Leave the current channel and enter a new one.
function enterChannel(newChannelId) {
    channelId = newChannelId;
    Cookies.set('channelId', channelId);
    channelIdDisplay.textContent = channelId;
    topic = `/app/chat/${newChannelId}`;

    if (currentSubscription) {
        currentSubscription.unsubscribe();
    }
    currentSubscription = stompClient.subscribe(`/channel/${channelId}`,    onMessageReceived);

    stompClient.send(`${topic}/addUser`,
        {},
        JSON.stringify({author: username, type: 'JOIN'})
    );
}

function onConnected() {
    enterChannel(channelInput.val());
    connectingElement.classList.add('hidden');
}

function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}

function sendMessage(event) {
    const messageContent = messageInput.value.trim();

    if (messageContent && stompClient) {
        const chatMessage = {
            author: username,
            content: messageInput.value,
            type: 'CHAT'
        };
        stompClient.send(`${topic}/sendMessage`, {}, JSON.stringify(chatMessage));
    }
    messageInput.value = '';
    event.preventDefault();
}

function onMessageReceived(payload) {
    const message = JSON.parse(payload.body);

    const messageElement = document.createElement('li');

    if (message.type == 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.author + ' joined!';
    } else if (message.type == 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.author + ' left!';
    } else {
        messageElement.classList.add('chat-message');

        const avatarElement = document.createElement('i');
        const avatarText = document.createTextNode(message.author[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.author);

        messageElement.appendChild(avatarElement);

        const usernameElement = document.createElement('span');
        const usernameText = document.createTextNode(message.author);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);

    }

    const channels = message.channels;
    renderChannels(channels);

    const textElement = document.createElement('p');
    const messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function renderChannels(channels) {

    if (channels != null) {
        while (channelList.firstChild) {
            channelList.removeChild(channelList.firstChild);
        }
        for (let i = 0; i < channels.length; i++) {
            const channel = document.createElement('li');
            channel.textContent = channels[i];
            const button = document.createElement('button');
            button.textContent = 'Join';
            button.className = 'primary';
            button.style.float = 'right';
            button.id = channels[i];
            button.addEventListener('click', joinChannel, true);

            channel.append(button);
            channelList.append(channel);
        }
    }
}
function joinChannel(event) {
    if(event.type === 'submit') {
        const channelName = channelCreateInput.value.trim();
        enterChannel(channelName);
        channelCreateInput.value = '';
        event.preventDefault();
    } else {
        enterChannel(event.currentTarget.id);
    }
    while (messageArea.firstChild) {
        messageArea.removeChild(messageArea.firstChild);
    }
}
function getAvatarColor(messageAuthor) {
    let hash = 0;
    for (let i = 0; i < messageAuthor.length; i++) {
        hash = 31 * hash + messageAuthor.charCodeAt(i);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
}

$(document).ready(function() {
    const savedName = Cookies.get('name');
    if (savedName) {
        nameInput.val(savedName);
    }

    const savedChannel = Cookies.get('channelId');
    if (savedChannel) {
        channelInput.val(savedChannel);
    }

    usernamePage.classList.remove('hidden');
    usernameForm.addEventListener('submit', connect, true);
    messageForm.addEventListener('submit', sendMessage, true);
    channelForm.addEventListener('submit', joinChannel, true);

});
