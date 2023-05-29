import { MilvusClient, DataType, InsertReq } from '@zilliz/milvus2-sdk-node';

const milvusClient = new MilvusClient('localhost:19530');

const generateInsertData = function generateInsertData(
  fields: { isVector: boolean; dim?: number; name: string; isBool?: boolean }[],
  count: number
) {
  const results: any = [];
  while (count > 0) {
    let value: any = {};



    fields.forEach(v => {
      // console.log("FIELDS  ", v)

      const { isVector, dim, name, isBool } = v;
      value[name] = isVector
        ? [...Array(dim)].map(() => Math.random() * 10)
        : isBool
        ? count % 2 === 0
        : count;
    });

    value['count'] = count;
    results.push(value);
    count--;
  }
  return results;
};

const hello_milvus = async () => {
  const checkVersion = await milvusClient.getVersion();
  console.log('--- check version ---', checkVersion);
  const collectionName = 'book';
  const dim = '4';
  const createRes = await milvusClient.createCollection({
    collection_name: "book",
    fields: [
      {
        name: "book_intro",
        description: "",
        data_type: DataType.FloatVector,
        dim: 2,
      },
      {
        name: "book_id",
        data_type: DataType.Int64,
        is_primary_key: true,
        description: "",
      },
      {
        name: "book_name",
        data_type: DataType.VarChar,
        max_length: 256,
        description: "",
      },
      {
        name: "word_count",
        data_type: DataType.Int64,
        description: "",
      }
    ],
  });
  console.log('--- Create collection ---', createRes, collectionName);

  const showCollectionRes = await milvusClient.showCollections();
  console.log('--- Show collections ---', showCollectionRes);

  const hasCollectionRes = await milvusClient.hasCollection({
    collection_name: collectionName,
  });
  console.log(
    '--- Has collection (' + collectionName + ') ---',
    hasCollectionRes
  );


  const data = Array.from({ length: 2000 }, (v,k) => ({
    "book_id": k,
    "word_count": k+10000,
    "book_name": `Book ${k}`,
    "book_intro": Array.from({ length: 2 }, () => Math.random()),
  }));
  const mr = await milvusClient.insert({
    collection_name: "book",
    fields_data: data,
  });

  console.log("MR ", mr)

  const index_params = {
    metric_type: "L2",
    index_type: "IVF_FLAT",
    params: JSON.stringify({ nlist: 1024 }),
  };

  var resultINDEX = await milvusClient.createIndex({
    collection_name: "book",
    field_name: "book_intro",
    extra_params: index_params,
  });

  console.log("resultINDEX" ,resultINDEX)


  // const fields = [
  //   {
  //     isVector: true,
  //     dim: 4,
  //     name: 'float_vector',
  //   },
  //   {
  //     isVector: false,
  //     name: 'random_value',
  //   },
  // ];
  // const vectorsData = generateInsertData(fields, 100);

  // const params: InsertReq = {
  //   collection_name: collectionName,
  //   fields_data: vectorsData,
  // };
  // await milvusClient.insert(params);
  // console.log('--- Insert Data to Collection ---');

  // await milvusClient.createIndex({
  //   collection_name: collectionName,
  //   field_name: 'float_vector',
  //   extra_params: {
  //     index_type: 'IVF_FLAT',
  //     metric_type: 'L2',
  //     params: JSON.stringify({ nlist: 10 }),
  //   },
  // });
  // console.log('--- Create Index in Collection ---');

  // need load collection before search
  // When you create a collection in Milvus, the collection data is initially stored on disk, and it is not immediately available for search and retrieval. In order to search or retrieve data from the collection, you must first load the collection into memory using the loadCollectionSync method.
  const loadCollectionRes = await milvusClient.loadCollectionSync({
    collection_name: collectionName,
  });
  console.log(
    '--- Load collection (' + collectionName + ') ---',
    loadCollectionRes
  );

  const searchParams = {
    anns_field: "book_intro",
    topk: "2",
    metric_type: "L2",
    params: JSON.stringify({ nprobe: 50 }),
  };
  
  const results = await milvusClient.search({
    collection_name: "book",
    expr: "",
    vectors: [[0.1, 0.2]],
    search_params: searchParams,
    vector_type: 101,    // DataType.FloatVector
  });
  
  
  console.log("RESULT -> ",results.results)


  // console.log( "vectorsData ", vectorsData)
  // const result = await milvusClient.search({
  //   collection_name: collectionName,
  //   vectors: [vectorsData[0]['float_vector']],
  //   search_params: {
  //     anns_field: 'float_vector',
  //     topk: '4',
  //     metric_type: 'L2',
  //     params: JSON.stringify({ nprobe: 1024 }),
  //     round_decimal: 4,
  //   },
  //   output_fields: ['count'],
  //   vector_type: DataType.FloatVector,
  // });
  // console.log('--- Search collection (' + collectionName + ') ---', result);

  const releaseRes = await milvusClient.releaseCollection({
    collection_name: collectionName,
  });
  console.log('--- Release Collection ---', releaseRes);

  const dropRes = await milvusClient.dropCollection({
    collection_name: collectionName,
  });
  console.log('--- Drop Collection ---', dropRes);
};

hello_milvus();
