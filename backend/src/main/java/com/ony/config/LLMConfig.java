package com.ony.config;


import com.ony.store.MongoChatMemoryStore;
import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.loader.FileSystemDocumentLoader;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.ChatMemoryProvider;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import dev.langchain4j.store.embedding.pinecone.PineconeEmbeddingStore;
import dev.langchain4j.store.embedding.pinecone.PineconeServerlessIndexConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
public class LLMConfig {
    @Autowired
    private MongoChatMemoryStore mongoChatMemoryStore;

    @Autowired
    private EmbeddingModel embeddingModel;


    @Bean
    public ChatMemory chatMemory(){
        return MessageWindowChatMemory.withMaxMessages(10);
    }


    @Bean
    public ChatMemoryProvider chatMemoryProviderQny(){

        return memoryId -> MessageWindowChatMemory
                .builder()
                .id(memoryId)
                .maxMessages(30)
                .chatMemoryStore(mongoChatMemoryStore)
                .build();
    }


        @Bean
        ContentRetriever contentRetrieverQny() {
            //使用FileSystemDocumentLoader读取指定目录下的知识库文档
            //并使用默认的文档解析器对文档进行解析
            Document document1 = FileSystemDocumentLoader.loadDocument("C:/Users/10938/Desktop/Qny/md/哈利波特.md");
            Document document2 = FileSystemDocumentLoader.loadDocument("C:/Users/10938/Desktop/Qny/md/苏格拉底.md");
            Document document3 = FileSystemDocumentLoader.loadDocument("C:/Users/10938/Desktop/Qny/md/孔子.md");
            Document document4 = FileSystemDocumentLoader.loadDocument("C:/Users/10938/Desktop/Qny/md/威廉·莎士比亚.md");
            Document document5 = FileSystemDocumentLoader.loadDocument("C:/Users/10938/Desktop/Qny/md/阿尔伯特·爱因斯坦.md");
            Document document6 = FileSystemDocumentLoader.loadDocument("C:/Users/10938/Desktop/Qny/md/夏洛克·福尔摩斯.md");

            List<Document> documents = Arrays.asList(document1,document2,document3);
             //使用内存向量存储
            InMemoryEmbeddingStore<TextSegment> embeddingStore = new InMemoryEmbeddingStore<>
                    ();
            //使用默认的文档分割器
            EmbeddingStoreIngestor.ingest(documents, embeddingStore);
             //从嵌入存储（EmbeddingStore）里检索和查询内容相关的信息
            return EmbeddingStoreContentRetriever.from(embeddingStore);
        }



//    @Bean
//    ContentRetriever contentRetrieverQny() {
//        // 使用FileSystemDocumentLoader读取指定目录下的知识库PDF文档
//        Document document1 = FileSystemDocumentLoader.loadDocument("C:/Users/10938/Desktop/Qny/pdf/hali.pdf");
////        Document document2 = FileSystemDocumentLoader.loadDocument("C:/Users/10938/Desktop/Qny/pdf/lunyu.pdf");
////        Document document3 = FileSystemDocumentLoader.loadDocument("C:/Users/10938/Desktop/Qny/pdf/hali.pdf");
//
//        List<Document> documents = Arrays.asList(document1);
//
//        InMemoryEmbeddingStore<TextSegment> embeddingStore = new InMemoryEmbeddingStore<>();
//        EmbeddingStoreIngestor.ingest(documents, embeddingStore);
//
//        return EmbeddingStoreContentRetriever.from(embeddingStore);
//    }



}
