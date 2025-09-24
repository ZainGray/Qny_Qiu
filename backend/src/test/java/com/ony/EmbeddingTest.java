package com.ony;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.loader.FileSystemDocumentLoader;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Arrays;
import java.util.List;

@SpringBootTest
public class EmbeddingTest {
        @Autowired
        private EmbeddingModel embeddingModel;

        @Autowired
        private EmbeddingStore embeddingStore;

        @Test
        public void testEmbeddingModel(){
            Response<Embedding> embed = embeddingModel.embed("你好");
                System.out.println("向量维度：" + embed.content().vector().length);
                System.out.println("向量输出：" + embed.toString());
        }


    /**
     * 将文本转换成向量，然后存储到pinecone中
     */
    @Test
    public void testPineconeEmbeded(){
            TextSegment segment1 = TextSegment.from("我喜欢打羽毛球");
            TextSegment segment2 = TextSegment.from("我喜欢打Java");
            Embedding embedding1 = embeddingModel.embed(segment1).content();
            Embedding embedding2 = embeddingModel.embed(segment2).content();
            embeddingStore.add(embedding1, segment1);
            embeddingStore.add(embedding2, segment2);
        }


    /**
     * Pinecone-相似度匹配
      */

    @Test
    public void embeddingSearch() {
        //提问，并将问题转成向量数据
        Embedding queryEmbedding = embeddingModel.embed("你最喜欢的运动是什么？").content();
        //创建搜索请求对象
        EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(1) //匹配最相似的一条记录
        //.minScore(0.8)
                .build();
        //根据搜索请求 searchRequest 在向量存储中进行相似度搜索
        EmbeddingSearchResult<TextSegment> searchResult = embeddingStore.search(searchRequest);
        //searchResult.matches()：获取搜索结果中的匹配项列表。
        //.get(0)：从匹配项列表中获取第一个匹配项
        EmbeddingMatch<TextSegment> embeddingMatch = searchResult.matches().get(0);
        //获取匹配项的相似度得分
        System.out.println(embeddingMatch.score()); // 0.8144288515898701

        //返回文本结果
        System.out.println(embeddingMatch.embedded().text());
    }


    @Test
    public void testUploadKnowledgeLibrary() {
        //使用FileSystemDocumentLoader读取指定目录下的知识库文档
        //并使用默认的文档解析器对文档进行解析

        Document document1 = FileSystemDocumentLoader.loadDocument("D:/课程练习/大模型应用实战/硅谷小智（医疗版）/资料/knowledge/knowledge/医院信息.md");
        Document document2 = FileSystemDocumentLoader.loadDocument("D:/课程练习/大模型应用实战/硅谷小智（医疗版）/资料/knowledge/knowledge/科室信息.md");
        Document document3 = FileSystemDocumentLoader.loadDocument("D:/课程练习/大模型应用实战/硅谷小智（医疗版）/资料/knowledge/knowledge/神经内科.md");
        //文本向量化并存入向量数据库：将每个片段进行向量化，得到一个嵌入向量
        List<Document> documents = Arrays.asList(document1, document2, document3);
        int batchSize = 5;
        for (int i = 0; i < documents.size(); i += batchSize) {
            List<Document> batch = documents.subList(i, Math.min(i + batchSize, documents.size()));
            EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
                    .documentSplitter(DocumentSplitters.recursive(500, 0))
                    .embeddingModel(embeddingModel)
                    .embeddingStore(embeddingStore)
                    .build();
            ingestor.ingest(batch);
        }

    }

}