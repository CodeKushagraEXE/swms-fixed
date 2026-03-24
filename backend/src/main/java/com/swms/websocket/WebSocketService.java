package com.swms.websocket;
import com.swms.dto.Dtos;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {
    @Autowired private SimpMessagingTemplate messagingTemplate;

    public void broadcastToProject(Long projectId, String eventType, Object payload, String actorName) {
        var event = new Dtos.WsEvent(eventType, payload, projectId, actorName);
        messagingTemplate.convertAndSend("/topic/project/" + projectId, event);
    }

    public void broadcastTaskEvent(Long projectId, String eventType, Object taskPayload, String actorName) {
        broadcastToProject(projectId, eventType, taskPayload, actorName);
    }
}
