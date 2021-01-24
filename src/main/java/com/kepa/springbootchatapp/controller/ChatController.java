package com.kepa.springbootchatapp.controller;

import com.kepa.springbootchatapp.model.Channel;
import com.kepa.springbootchatapp.model.Message;
import com.kepa.springbootchatapp.repository.ChannelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;

import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static java.lang.String.format;

@Controller
public class ChatController {
    private final SimpMessageSendingOperations messagingTemplate;
    private final ChannelRepository channelRepository;

    @Autowired
    public ChatController(SimpMessageSendingOperations messagingTemplate, ChannelRepository channelRepository) {
        this.messagingTemplate = messagingTemplate;
        this.channelRepository = channelRepository;
    }

    @MessageMapping("/chat/{channelId}/sendMessage")
    public void sendMessage(@DestinationVariable String channelId, @Payload Message message) {
        List<Channel> channels = channelRepository.findAll();
        message.setChannels(channels.stream()
                            .map(Channel::getName)
                            .collect(Collectors.toList()));
        messagingTemplate.convertAndSend(format("/channel/%s", channelId), message);
    }

    @MessageMapping("/chat/{channelId}/addUser")
    public void addUser(@DestinationVariable String channelId, @Payload  Message message,
                        SimpMessageHeaderAccessor headerAccessor) {
        Optional<Channel> channelByName = channelRepository.findByName(channelId);
        if(channelByName.isEmpty()){
            channelRepository.save(Channel
                    .builder()
                    .name(channelId)
                    .build());
        }

        String currentChannelId = (String) headerAccessor.getSessionAttributes().put("channelId", channelId);
        if (currentChannelId != null) {
            Message leaveMessage = new Message();
            leaveMessage.setType(Message.Type.LEAVE);
            leaveMessage.setAuthor(message.getAuthor());
            messagingTemplate.convertAndSend(format("/channel/%s", currentChannelId), leaveMessage);
        }
        headerAccessor.getSessionAttributes().put("username", message.getAuthor());

        List<Channel> channels = channelRepository.findAll();
        message.setChannels(channels.stream()
                .map(Channel::getName)
                .collect(Collectors.toList()));
        messagingTemplate.convertAndSend(format("/channel/%s", channelId), message);
    }
}


