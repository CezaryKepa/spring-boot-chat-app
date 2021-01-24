package com.kepa.springbootchatapp.repository;

import com.kepa.springbootchatapp.model.Channel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface ChannelRepository extends JpaRepository<Channel, Long> {
    Optional<Channel> findByName(String name);
}
