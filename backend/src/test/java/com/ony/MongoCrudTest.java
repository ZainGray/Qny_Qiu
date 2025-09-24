package com.ony;


import com.ony.bean.ChatMessages;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;


@SpringBootTest
public class MongoCrudTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * 插入文档
     */
    @Test
    public void testInsert() {
        ChatMessages chatMessages = new ChatMessages();
        chatMessages.setContent("聊天记录列表");
        mongoTemplate.insert(chatMessages);
    }

    /**
     * 查询文档
     */
    @Test
    public void testFind() {
        ChatMessages chatMessages = mongoTemplate.findById("68a5b230d328d73558bee10e", ChatMessages.class);
        System.out.println(chatMessages);
    }

    /**
     * 更新文档
     */
    @Test
    public void testUpdate() {
        Criteria criteria = Criteria.where("_id").is("100");
        Query query = new Query(criteria);
        Update update = new Update();
        update.set("content", "hello world update1");
        //修改或新增
        mongoTemplate.upsert(query, update, ChatMessages.class);
    }

    /**
     * 删除文档
     */
    @Test
    public void testDelete() {
       Criteria criteria = Criteria.where("_id").is("68a5b230d328d73558bee10e");
       Query query = new Query(criteria);
       mongoTemplate.remove(query, ChatMessages.class);
    }

}
