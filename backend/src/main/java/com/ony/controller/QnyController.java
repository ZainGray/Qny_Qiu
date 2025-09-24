package com.ony.controller;

import com.ony.bean.ChatForm;
import com.ony.service.QnyAgent;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;


@Tag(name = "七牛云")
@RestController
@RequestMapping("/qny")
public class QnyController {

    @Autowired
    private QnyAgent qnyAgent;


    @Operation(summary = "对话-流式")
    @PostMapping(value = "/chat", produces = "text/stream;charset=utf-8")
    public Flux<String> chat(@RequestBody ChatForm chatForm){
        return qnyAgent.chat(chatForm.getMemoryId(), chatForm.getMessage());
    }

    @Operation(summary = "对话-非流式")
    @PostMapping(value = "/chat-sync", produces = "application/json;charset=utf-8")
    public String chatSync(@RequestBody ChatForm chatForm){
        return qnyAgent.chat(chatForm.getMemoryId(), chatForm.getMessage())
                .reduce("", (acc, current) -> acc + current)
                .block(); // 将流式响应转换为同步响应
    }


}
