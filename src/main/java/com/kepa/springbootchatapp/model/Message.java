package com.kepa.springbootchatapp.model;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class Message {
    private Type type;
    private String content;
    private String author;
    private List<String> channels;

    public enum Type {
        CHAT,
        JOIN,
        LEAVE
    }
}
