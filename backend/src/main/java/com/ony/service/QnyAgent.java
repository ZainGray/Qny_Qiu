package com.ony.service;


import dev.langchain4j.service.MemoryId;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.spring.AiService;
import reactor.core.publisher.Flux;

import static dev.langchain4j.service.spring.AiServiceWiringMode.EXPLICIT;

@AiService(
        wiringMode = EXPLICIT,
//        chatModel = "openAiChatModel",
        streamingChatModel = "openAiStreamingChatModel",
        chatMemoryProvider = "chatMemoryProviderQny",
//        tools = "appointmentTools",
        contentRetriever = "contentRetrieverQny"
)
public interface QnyAgent {
    @SystemMessage(fromResource = "qny-prompt-template.txt")
    Flux<String> chat(@MemoryId Long memoryId, @UserMessage  String prompt);
}
