package com.kepa.springbootchatapp.eventlistener;

import com.kepa.springbootchatapp.model.Message;
import com.kepa.springbootchatapp.repository.ChannelRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import static java.lang.String.format;

@Component
@Slf4j
public class WebSocketEventListener {

    private final SimpMessageSendingOperations messagingTemplate;
    private final ChannelRepository channelRepository;

    public WebSocketEventListener(SimpMessageSendingOperations messagingTemplate, ChannelRepository channelRepository) {
        this.messagingTemplate = messagingTemplate;
        this.channelRepository = channelRepository;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        log.info("New web socket connection: {}",event);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        String channelId = (String) headerAccessor.getSessionAttributes().get("channelId");

        if(username != null) {
            log.info("User Disconnected : " + username);

            Message message = new Message();
            message.setType(Message.Type.LEAVE);
            message.setAuthor(username);

            messagingTemplate.convertAndSend(format("/channel/%s", channelId), message);

        }
    }
}
