const express = require("express");
const pool = require("./db");
const app = express();
const PORT = 5000;
const cors = require("cors");

app.use(cors());

app.use(express.json());
app.get("/", (req, res) => {
  res.send("DBからの出力ではない。");
});

// 都道府県(api)
app.get("/api", (req, res) => {
  pool.query("select lg_code, pref_name, city_name, od_city_name from mt_city", (error, results) => {
    if (error) throw error;
    return res.status(200).json(results.rows)
  });
});

app.get("/test", (req, res) => {
    pool.query("select * from rs_land_type_code limit 100;", (error, results) => {
        if (error) throw error;
        return res.status(200).json(results.rows);
    });
});

app.get("/test2", (req, res) => {
  pool.query("select distinct * from vw_mt_parcel limit 1000;", (error, results) => {
      if (error) throw error;
      return res.status(200).json(results.rows);
  });
});


//ポリゴンの場所に応じて
app.get("/test7", (req, res) => {
  const { lgCodePrefix, result, result2, result3, result4, result5 } = req.query;
  const queryA = `select pref_name, city_name, juukyo_name, juukyo_num from juukyo_num`;

  console.log(queryA);

  pool.query(queryA, (error, resultsA) => {
    if (error) throw error;

    if (resultsA.rows.length === 0) {
      return res.status(200).json([]); // 結果がない場合は空の配列を返す
    }
    // const queryB = `SELECT * FROM rs_rspos_land WHERE rs_id IN (${rsIds.join(", ")});`;
    pool.query(queryA, (error, resultsB) => {
      if (error) throw error;
      return res.status(200).json(resultsB.rows);
    });
  });
});
//この５つは合体させる、しかし 検索ボタンを考慮するように


//land
app.get("/bbb", (req, res) => {
  const { lgCodePrefix } = req.query;
  const queryA = `select * from rs_rspos_bldg limit 10;`;
  console.log(queryA);

  pool.query(queryA, (error, resultsA) => {
    if (error) throw error;

    if (resultsA.rows.length === 0) {
      return res.status(200).json([]); // 結果がない場合は空の配列を返す
    }
    // const queryB = `SELECT * FROM rs_rspos_land WHERE rs_id IN (${rsIds.join(", ")});`;
    pool.query(queryA, (error, resultsB) => {
      if (error) throw error;
      return res.status(200).json(resultsB.rows);
    });
  });
});


// 町丁目
app.get("/suggestions", (req, res) => {
    const searchText = req.query.search || "";
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    let exactMatches = [];
    let partialMatches = [];

    res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Prgma: "no-cache",
        Expires: "0",
    });

    if (searchText) {
        pool.query(
            "SELECT coalesce(lg_code, '') as lg_code, coalesce(oaza_town_name, '') as oaza_town_name, coalesce(chome_name, '') as chome_name FROM mt_town WHERE oaza_town_name = $1 OR chome_name = $1 group by lg_code, oaza_town_name, chome_name",
            [searchText],
            (error, results) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send("エラー");
                }
                exactMatches = results.rows;
                //完全一致して候補が見つかる場合それを優先
                if (exactMatches.length > 0) {
                    return res.status(200).json(exactMatches);
                }
                //完全一致しない場合部分一致する候補だけ検索
                else {
                    pool.query(
                        "SELECT coalesce(lg_code, '') as lg_code, coalesce(oaza_town_name, '') as oaza_town_name, coalesce(chome_name, '') as chome_name FROM mt_town WHERE oaza_town_name ILIKE $1 OR chome_name ILIKE $1 group by lg_code, oaza_town_name, chome_name limit $2 offset $3"
                        ['%${searchText}%', limit, offset],
                        (error, results) => {
                            if (error) {
                                console.error(error);
                                return res.status(500).send("エラー");
                            }
                            partialMatches = results.rows;
                            //完全一致も部分一致も見つからない場合、部分一致する候補を検索
                            if (partialMatches.length === 0) {
                                return res.status(200).json([]);
                            }
                            // 部分一致した候補が見つかった場合、その候補を返す
                            else {
                                return res.status(200).json(partialMatches);
                            }
                        }
                    );
                }
            }
        );
    }
    // 検索文字列がない場合、全部取得
    else {
        pool.query(
            "SELECT coalesce(lg_code, '') as lg_code, coalesce(oaza_town_name, '') as oaza_town_name, coalesce(chome_name, '') as chome_name FROM mt_town group by lg_code, oaza_town_name, chome_name limit $1 offset $2",
            [limit, offset],
            (error, results) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send("エラー");
                }
                return res.status(200).json(results.rows);
            }
        );
    }
});

// views(api)
app.get("/views", (req, res) => {
  const { lgCodePrefix, searchText, jukyoNum } = req.query;
  let query = "SELECT * FROM vw_mt_town WHERE (lg_code = $1) AND (";
  const params = [`${lgCodePrefix}`];

  query += "cms_juukyo_name LIKE '%' || func_hyoukiyure1($" + (params.length + 1) + ") || '%'";
  params.push(`${searchText}`);
  query += ")";

  if (jukyoNum) {
    query += " AND (";
    query += "cms_jukyo_num LIKE '%' || func_hyoukiyure2($" + (params.length + 1) + ") || '%'";
    params.push(`${jukyoNum}`);
    query += ")";
  }
  
  pool.query(query, params, (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send();
    }
    return res.status(200).send(results.rows);
  });
});

// views(api)
app.get("/views2", (req, res) => {
  const { lgCodePrefix, searchText2, chibanNum } = req.query;
  let query = "SELECT * FROM vw_mt_parcel WHERE (lg_code = $1) AND (";
  const params = [`${lgCodePrefix}`];

  query += "cms_juukyo_name LIKE '%' || func_hyoukiyure1($" + (params.length + 1) + ") || '%'";
  params.push(`${searchText2}`);
  query += ")";

  if (chibanNum) {
    query += " AND (";
    query += "cms_chiban_num LIKE '%' || func_hyoukiyure2($" + (params.length + 1) + ") || '%'";
    params.push(`${chibanNum}`);
    query += ")";
  }
  
  pool.query(query, params, (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send();
    }
    return res.status(200).send(results.rows);
  });
});





// 特定のrsiddbを取得する
app.get("/users/:id", (req,res) => {
    const id = req.params.id;

    pool.query("SELECT * FROM rsiddb WHERE id = 1$", [id], (error, results) => {
        if (error) throw error;
        return res.status(200).json(results.rows);
    });
});


app.listen(PORT, () => {
    console.log("server is running on " + PORT );
});




/////////////  Backend for Search2_1 ////////////////
app.get('/search1', async (req, res) => {
  if(typeof req.query.type == 'string')
  {
    const type = req.query.type;
    if(type == 1)
    {
      try {
        const result = await pool.query('SELECT pref_code, pref_name FROM mt_pref ORDER BY pref_code');
        const prefs = result.rows;
        res.send(prefs);
      } catch (error) {
        console.error(error);
        res.status(500).send('Error searching data');
      }
    }
    else if(type == 2)
    {
      try {
        const result = await pool.query('SELECT lg_code, city_name, od_city_name FROM mt_city ORDER BY lg_code');
        const cities = result.rows;
        res.send(cities);
      } catch (error) {
        console.error(error);
        res.status(500).send('Error searching data');
      }
    }
    else if(type == 3)
    {
      try {
        const result = await pool.query('SELECT DISTINCT house_type FROM public.rs_rsinfo_bldg WHERE house_type IS NOT NULL ORDER BY house_type');
        const house_types = result.rows;
        res.send(house_types);
      } catch (error) {
        console.error(error);
        res.status(500).send('Error searching data');
      }
    }
  }
  else
  {
    const pref_code = req.query.prefName; //like
    const lg_code = req.query.lgCode;     //equal
    const juukyo_name = req.query.juukyoName; //like
    const chiban_num = req.query.chibanNum; //equal
    const land_type = req.query.landType; //equal
    const land_space1 = req.query.landSpace1;
    const landSpace1Score = req.query.landSpace1Scope;
    const redist_date1 = req.query.redistDate1;
    const redistDate1Score = req.query.redistDate1Scope;
    try {
      var where = '1=1';
      //var where1 = '1=1';
      var limit = '';
      var values = [];
      var paramCount = 1;
      if(pref_code != '')
      {
        where += ' AND PUBLIC.vw_mt_parcel.lg_code LIKE $' + (paramCount++);
        values.push(`${pref_code}%`);
      }
      if(lg_code != '')
      {
        where += ' AND PUBLIC.vw_mt_parcel.lg_code = $' + (paramCount++);
        values.push(`${lg_code}`);
      }
      if(juukyo_name != '')
      {
        where += ' AND PUBLIC.vw_mt_parcel.cms_juukyo_name LIKE $' + (paramCount++);
        values.push(`%${juukyo_name}%`);
      }
      if(chiban_num != '')
      {
        where += ' AND PUBLIC.vw_mt_parcel.chiban_num = $' + (paramCount++);
        values.push(`${chiban_num}`);
      }
      if(land_type != '')
      {
        where += ' AND PUBLIC.rs_rsinfo_land.land_type = $' + (paramCount++);
        values.push(`${land_type}`);
      }
      if(land_space1 != '')
      {
        if(landSpace1Score == '0')
        {
          where += ' AND PUBLIC.rs_rsinfo_land.land_space >= $' + (paramCount++);
          values.push(`${land_space1}`);
        }
        else if(landSpace1Score == '1')
        {
          where += ' AND PUBLIC.rs_rsinfo_land.land_space < $' + (paramCount++);
          values.push(`${land_space1}`);      
        }
      }
      if(redist_date1 != '')
      {
        if(redistDate1Score == '0')
        {
          where += ' AND PUBLIC.rs_rsinfo_land.redist_date >= $' + (paramCount++);
          values.push(`${redist_date1}`);
        }
        else if(redistDate1Score == '1')
        {
          where += ' AND PUBLIC.rs_rsinfo_land.redist_date < $' + (paramCount++);
          values.push(`${redist_date1}`);      
        }
      }
      //limit = `LIMIT $` + paramCount;
      //values.push(100);
      
      const query = `
        SELECT DISTINCT
          1 as result_type,
          PUBLIC.rs_rspos_land.rs_id,
          Concat(PUBLIC.vw_mt_parcel.full_name,' ', PUBLIC.vw_mt_parcel.chiban_num) full_name,
          PUBLIC.vw_mt_parcel.chiban_num,
          rep_pnt_lat1,
          rep_pnt_lon1,
          ST_AsGeoJSON(plygn_geom1) plygn_geom1 
        FROM
          PUBLIC.rs_rspos_land
          LEFT JOIN PUBLIC.rs_rsinfo_land 
            ON PUBLIC.rs_rspos_land.rs_id = PUBLIC.rs_rsinfo_land.rs_id
          LEFT JOIN PUBLIC.vw_mt_parcel 
            ON PUBLIC.vw_mt_parcel.prc_id = PUBLIC.rs_rsinfo_land.prc_id 
        WHERE ` + where + ` AND PUBLIC.vw_mt_parcel.full_name IS NOT NULL AND rep_pnt_lat1 IS NOT NULL AND rep_pnt_lon1 IS NOT NULL ` + limit;
        //AND PUBLIC.vw_mt_parcel.town_id = PUBLIC.vw_mt_town.town_id AND PUBLIC.vw_mt_parcel.rsdt_addr_flg = PUBLIC.vw_mt_town.rsdt_addr_flg
      const { rows } = await pool.query(query, values);
      res.send(rows);
    } catch (err) {
      console.error('Error searching in PostgreSQL', err);
      res.status(500).send('Internal server error');
    }
  }
});

/////////////  Backend for Search2_2 ////////////////
app.get('/search2', async (req, res) => {
  const pref_code = req.query.prefName; //like
  const lg_code = req.query.lgCode;     //equal
  const juukyo_name = req.query.juukyoName; //like
  const chiban_num = req.query.chibanNum; //equal
  const house_num = req.query.houseNum;
  const house_type = req.query.houseType;
  const structure_val = req.query.structureVal;
  const land_space2 = req.query.landSpace2;
  const landSpace2Score = req.query.landSpace2Scope;
  const redist_date2 = req.query.redistDate2;
  const redistDate2Score = req.query.redistDate2Scope;
  const cms_bldg_name = req.query.cmsBldgName;
  //const bldg_name = req.query.bldgName;
  try {
    var where = '1=1';
    var limit = '';
    var values = [];
    var paramCount = 1;
    if(pref_code != '')
    {
      where += ' AND PUBLIC.vw_mt_parcel.lg_code LIKE $' + (paramCount++);
      values.push(`${pref_code}%`);
    }
    if(lg_code != '')
    {
      where += ' AND PUBLIC.vw_mt_parcel.lg_code = $' + (paramCount++);
      values.push(`${lg_code}`);
    }
    if(juukyo_name != '')
    {
      where += ' AND PUBLIC.vw_mt_town.cms_juukyo_name LIKE $' + (paramCount++);
      values.push(`%${juukyo_name}%`);
    }
    if(chiban_num != '')
    {
      where += ' AND PUBLIC.vw_mt_town.cms_jukyo_num = $' + (paramCount++);
      values.push(`${chiban_num}`);
    }
    if(house_num != '')
    {
      where += ' AND PUBLIC.rs_rsinfo_bldg.house_num LIKE $' + (paramCount++);
      values.push(`${house_num}%`);
    }
    if(house_type != '')
    {
      where += ' AND PUBLIC.rs_rsinfo_bldg.house_type = $' + (paramCount++);
      values.push(`${house_type}`);
    }
    if(structure_val != '')
    {
      where += ' AND PUBLIC.rs_rsinfo_bldg.structure_val LIKE $' + (paramCount++);
      values.push(`%${structure_val}%`);
    }
    if(redist_date2 != '')
    {
      if(redistDate2Score == '0')
      {
        where += ' AND PUBLIC.rs_rsinfo_bldg.redist_date1 >= $' + (paramCount++);
        values.push(`${redist_date2}`);
      }
      else if(redistDate2Score == '12')
      {
        where += ' AND PUBLIC.rs_rsinfo_bldg.redist_date1 < $' + (paramCount++);
        values.push(`${redist_date2}`);      
      }
    }
    if(cms_bldg_name != '')
    {
      where += ' AND PUBLIC.rs_rsinfo_bldg.bldg_name LIKE $' + (paramCount++);
      values.push(`%${cms_bldg_name}%`);
    }
    /*
    if(bldg_name != '')
    {
      where += ' AND PUBLIC.rs_rsinfo_bldg.bldg_name LIKE $' + (paramCount++);
      values.push(`%${bldg_name}%`);
    }
    */
    if(land_space2 != '')
    {
      if(landSpace2Score == '0')
      {
        where += ' AND PUBLIC.rs_rsinfo_bldg.floor_space IS NOT NULL AND $' + (paramCount++) + ' <= ANY(STRING_TO_ARRAY(floor_space, \'_\')::FLOAT[]) ';
        values.push(`${land_space2}`);
      }
      else if(landSpace2Score == '1')
      {
        where += ' AND PUBLIC.rs_rsinfo_bldg.floor_space IS NOT NULL AND $' + (paramCount++) + ' > ANY(STRING_TO_ARRAY(floor_space, \'_\')::FLOAT[]) ';
        values.push(`${land_space2}`);      
      }
    }
    //limit = `LIMIT $` + paramCount;
    //values.push(100);
    const query = `
      SELECT DISTINCT
        2 as result_type,
        PUBLIC.rs_rspos_bldg.rs_id,
        Concat(PUBLIC.vw_mt_town.full_name,' ', PUBLIC.vw_mt_town.cms_jukyo_num, ' ', PUBLIC.rs_rsinfo_bldg.bldg_name) full_name,
        PUBLIC.vw_mt_town.cms_jukyo_num,
        rep_pnt_lat1,
        rep_pnt_lon1,
        ST_AsGeoJSON(plygn_geom1) plygn_geom1
      FROM
        PUBLIC.rs_rspos_bldg
        LEFT JOIN PUBLIC.rs_rsinfo_bldg 
          ON PUBLIC.rs_rspos_bldg.rs_id = PUBLIC.rs_rsinfo_bldg.rs_id
        LEFT JOIN PUBLIC.vw_mt_parcel 
          ON PUBLIC.vw_mt_parcel.prc_id = PUBLIC.rs_rsinfo_bldg.prc_id 
        LEFT JOIN PUBLIC.vw_mt_town 
          ON PUBLIC.vw_mt_parcel.lg_code = PUBLIC.vw_mt_town.lg_code AND PUBLIC.vw_mt_parcel.town_id = PUBLIC.vw_mt_town.town_id AND PUBLIC.vw_mt_parcel.rsdt_addr_flg = PUBLIC.vw_mt_town.rsdt_addr_flg
      WHERE ` + where + ` AND PUBLIC.vw_mt_town.full_name IS NOT NULL AND rep_pnt_lat1 IS NOT NULL AND rep_pnt_lon1 IS NOT NULL ` + limit;
      //AND PUBLIC.vw_mt_parcel.town_id = PUBLIC.vw_mt_town.town_id AND PUBLIC.vw_mt_parcel.rsdt_addr_flg = PUBLIC.vw_mt_town.rsdt_addr_flg
    const { rows } = await pool.query(query, values);
    res.send(rows);
  } catch (err) {
    console.error('Error searching in PostgreSQL', err);
    res.status(500).send('Internal server error');
  }
});

/////////////  Backend for Search 1 ////////////////

app.get('/search_filter1', async (req, res) => {
  const pref_code = req.query.prefName; //like
  const lg_code = req.query.lgCode;     //equal
  const juukyo_name = req.query.juukyoName; //like
  const jukyo_num = req.query.jukyoNum; //equal
  const house_num = req.query.houseNum;
  const house_type = req.query.houseType;
  const structure_val = req.query.structureVal;
  const land_space = req.query.landSpace;
  const landSpaceScore = req.query.landSpaceScope;
  const redist_date = req.query.redistDate;
  const redistDateScore = req.query.redistDateScope;
  const cms_bldg_name = req.query.cmsBldgName;
  try {
    var where = '1=1';
    var limit = '';
    var values = [];
    var paramCount = 1;
    if(pref_code != '')
    {
      where += ' AND PUBLIC.vw_mt_parcel.lg_code LIKE $' + (paramCount++);
      values.push(`${pref_code}%`);
    }
    if(lg_code != '')
    {
      where += ' AND PUBLIC.vw_mt_parcel.lg_code = $' + (paramCount++);
      values.push(`${lg_code}`);
    }
    if(juukyo_name != '')
    {
      where += ' AND PUBLIC.vw_mt_parcel.cms_juukyo_name LIKE $' + (paramCount++);
      values.push(`%${juukyo_name}%`);
    }
    if(jukyo_num != '')
    {
      where += ' AND PUBLIC.vw_mt_parcel.cms_chiban_num = $' + (paramCount++);
      values.push(`${jukyo_num}`);
    }
    //limit = `LIMIT $` + paramCount;
    //values.push(100);
    
    const query = `
      SELECT DISTINCT
        1 result_type,
        PUBLIC.rs_rspos_land.rs_id,
        CONCAT(PUBLIC.vw_mt_parcel.cms_juukyo_name, ' ', PUBLIC.vw_mt_parcel.chiban_num) full_name,
        PUBLIC.vw_mt_parcel.chiban_num chiban_num,
        rep_pnt_lat1,
        rep_pnt_lon1,
        ST_AsGeoJSON(plygn_geom1) plygn_geom1
      FROM
        PUBLIC.rs_rspos_land
        LEFT JOIN PUBLIC.rs_rsinfo_land 
          ON PUBLIC.rs_rspos_land.rs_id = PUBLIC.rs_rsinfo_land.rs_id
        LEFT JOIN PUBLIC.vw_mt_parcel 
          ON PUBLIC.vw_mt_parcel.prc_id = PUBLIC.rs_rsinfo_land.prc_id 
        WHERE ` + where + ` AND PUBLIC.vw_mt_parcel.cms_juukyo_name IS NOT NULL AND rep_pnt_lat1 IS NOT NULL AND rep_pnt_lon1 IS NOT NULL ` + limit;

    var where1 = '1=1';
    var limit1 = '';
    var values1 = [];
    var paramCount = 1;
    if(pref_code != '')
    {
      where1 += ' AND PUBLIC.vw_mt_parcel.lg_code LIKE $' + (paramCount++);
      values1.push(`${pref_code}%`);
    }
    if(lg_code != '')
    {
      where1 += ' AND PUBLIC.vw_mt_parcel.lg_code = $' + (paramCount++);
      values1.push(`${lg_code}`);
    }
    if(juukyo_name != '')
    {
      where1 += ' AND PUBLIC.vw_mt_town.cms_juukyo_name LIKE $' + (paramCount++);
      values1.push(`%${juukyo_name}%`);
    }
    if(jukyo_num != '')
    {
      where1 += ' AND PUBLIC.vw_mt_town.cms_jukyo_num = $' + (paramCount++);
      values1.push(`${jukyo_num}`);
    }
    if(house_num != '')
    {
      where1 += ' AND PUBLIC.rs_rsinfo_bldg.house_num LIKE $' + (paramCount++);
      values1.push(`${house_num}%`);
    }
    if(house_type != '')
    {
      where1 += ' AND PUBLIC.rs_rsinfo_bldg.house_type = $' + (paramCount++);
      values1.push(`${house_type}`);
    }
    if(structure_val != '')
    {
      where1 += ' AND PUBLIC.rs_rsinfo_bldg.structure_val LIKE $' + (paramCount++);
      values1.push(`%${structure_val}%`);
    }
    if(redist_date != '')
    {
      if(redistDateScore == '0')
      {
        where1 += ' AND PUBLIC.rs_rsinfo_bldg.redist_date1 >= $' + (paramCount++);
        values1.push(`${redist_date}`);
      }
      else if(redistDateScore == '1')
      {
        where1 += ' AND PUBLIC.rs_rsinfo_bldg.redist_date1 < $' + (paramCount++);
        values1.push(`${redist_date}`);      
      }
    }
    if(cms_bldg_name != '')
    {
      where1 += ' AND PUBLIC.rs_rsinfo_bldg.bldg_name LIKE $' + (paramCount++);
      values1.push(`%${cms_bldg_name}%`);
    }
    /*
    if(bldg_name != '')
    {
      where1 += ' AND PUBLIC.rs_rsinfo_bldg.bldg_name LIKE $' + (paramCount++);
      values1.push(`%${bldg_name}%`);
    }
    */
    if(land_space != '')
    {
      if(landSpaceScore == '0')
      {
        where1 += ' AND PUBLIC.rs_rsinfo_bldg.floor_space IS NOT NULL AND $' + (paramCount++) + ' <= ANY(STRING_TO_ARRAY(floor_space, \'_\')::FLOAT[]) ';
        values1.push(`${land_space}`);
      }
      else if(landSpaceScore == '1')
      {
        where1 += ' AND PUBLIC.rs_rsinfo_bldg.floor_space IS NOT NULL AND $' + (paramCount++) + ' > ANY(STRING_TO_ARRAY(floor_space, \'_\')::FLOAT[]) ';
        values1.push(`${land_space}`);      
      }
    }
    //limit1 = `LIMIT $` + paramCount;
    //values1.push(100);
    const query1 = `
      SELECT DISTINCT
        2 result_type,
        PUBLIC.rs_rspos_bldg.rs_id,
        CONCAT(PUBLIC.vw_mt_town.cms_juukyo_name, ' ', PUBLIC.vw_mt_town.cms_jukyo_num, ' ', PUBLIC.rs_rsinfo_bldg.bldg_name) full_name,
        PUBLIC.vw_mt_town.cms_jukyo_num chiban_num,
        rep_pnt_lat1,
        rep_pnt_lon1,
        ST_AsGeoJSON(plygn_geom1) plygn_geom1
      FROM
        PUBLIC.rs_rspos_bldg
        LEFT JOIN PUBLIC.rs_rsinfo_bldg 
          ON PUBLIC.rs_rspos_bldg.rs_id = PUBLIC.rs_rsinfo_bldg.rs_id
        LEFT JOIN PUBLIC.vw_mt_parcel 
          ON PUBLIC.vw_mt_parcel.prc_id = PUBLIC.rs_rsinfo_bldg.prc_id 
        LEFT JOIN PUBLIC.vw_mt_town 
          ON PUBLIC.vw_mt_parcel.lg_code = PUBLIC.vw_mt_town.lg_code AND PUBLIC.vw_mt_parcel.town_id = PUBLIC.vw_mt_town.town_id AND PUBLIC.vw_mt_parcel.rsdt_addr_flg = PUBLIC.vw_mt_town.rsdt_addr_flg
      WHERE ` + where1 + ` AND PUBLIC.vw_mt_town.cms_juukyo_name IS NOT NULL AND rep_pnt_lat1 IS NOT NULL AND rep_pnt_lon1 IS NOT NULL ` + limit1;
    var resData = [];
    {
      const { rows } = await pool.query(query, values);
      resData.push(...rows);
    }
    {
      const { rows } = await pool.query(query1, values1);
      resData.push(...rows);
    }
    res.send(resData);
  } catch (err) {
    console.error('Error searching in PostgreSQL', err);
    res.status(500).send('Internal server error');
  }
});

/////////////  Backend for Search 3 ////////////////

app.get('/search_filter3', async (req, res) => {
  const rs_id_start = req.query.rsIdStart;
  const rs_id_end = req.query.rsIdEnd;

  try {
    var where = '1=1';
    var limit = '';
    var values = [];
    var paramCount = 1;
    if(rs_id_start != '' && rs_id_end != '')
    {
      where += ' AND PUBLIC.rs_rsinfo_land.rs_id = $' + (paramCount++);
      var rs_id = `${rs_id_start}` + '-' + `${rs_id_end}`;
      values.push(rs_id);
    }
    //limit = `LIMIT $` + paramCount;
    //values.push(100);
    
    const query = `
      SELECT DISTINCT
        1 result_type,
        PUBLIC.rs_rsinfo_land.rs_id,
        CONCAT(PUBLIC.vw_mt_parcel.cms_juukyo_name, ' ', PUBLIC.vw_mt_parcel.chiban_num) full_name,
        PUBLIC.vw_mt_parcel.chiban_num chiban_num,
        rep_pnt_lat1,
        rep_pnt_lon1,
        ST_AsGeoJSON(plygn_geom1) plygn_geom1
      FROM
        PUBLIC.rs_rspos_land
        LEFT JOIN PUBLIC.rs_rsinfo_land 
          ON PUBLIC.rs_rspos_land.rs_id = PUBLIC.rs_rsinfo_land.rs_id
        LEFT JOIN PUBLIC.vw_mt_parcel 
          ON PUBLIC.vw_mt_parcel.prc_id = PUBLIC.rs_rsinfo_land.prc_id 
      WHERE ` + where + ` AND PUBLIC.vw_mt_parcel.cms_juukyo_name IS NOT NULL AND rep_pnt_lat1 IS NOT NULL AND rep_pnt_lon1 IS NOT NULL ` + limit;
    
    var where1 = '1=1';
    var limit1 = '';
    var values1 = [];
    var paramCount = 1;
    if(rs_id_start != '' && rs_id_end != '')
    {
      where1 += ' AND PUBLIC.rs_rsinfo_bldg.rs_id = $' + (paramCount++);
      var rs_id = `${rs_id_start}` + '-' + `${rs_id_end}`;
      values1.push(rs_id);
    }
    
    const query1 = `
      SELECT DISTINCT
        2 result_type,
        PUBLIC.rs_rsinfo_bldg.rs_id,
        CONCAT(PUBLIC.vw_mt_town.cms_juukyo_name, ' ', PUBLIC.vw_mt_town.cms_jukyo_num, ' ', PUBLIC.rs_rsinfo_bldg.bldg_name) full_name,
        rep_pnt_lat1,
        rep_pnt_lon1,
        ST_AsGeoJSON(plygn_geom1) plygn_geom1
      FROM
        PUBLIC.rs_rspos_bldg
        LEFT JOIN PUBLIC.rs_rsinfo_bldg 
          ON PUBLIC.rs_rspos_bldg.rs_id = PUBLIC.rs_rsinfo_bldg.rs_id
        LEFT JOIN PUBLIC.vw_mt_parcel 
          ON PUBLIC.vw_mt_parcel.prc_id = PUBLIC.rs_rsinfo_bldg.prc_id 
        LEFT JOIN PUBLIC.vw_mt_town 
          ON PUBLIC.vw_mt_parcel.lg_code = PUBLIC.vw_mt_town.lg_code AND PUBLIC.vw_mt_parcel.town_id = PUBLIC.vw_mt_town.town_id AND PUBLIC.vw_mt_parcel.rsdt_addr_flg = PUBLIC.vw_mt_town.rsdt_addr_flg
      WHERE ` + where1 + ` AND PUBLIC.vw_mt_town.cms_juukyo_name IS NOT NULL AND rep_pnt_lat1 IS NOT NULL AND rep_pnt_lon1 IS NOT NULL ` + limit1;

    var resData = [];
    {
      const { rows } = await pool.query(query, values);
      resData.push(...rows);
    }
    {
      const { rows } = await pool.query(query1, values1);
      resData.push(...rows);
    }
    res.send(resData);
  } catch (err) {
    console.error('Error searching in PostgreSQL', err);
    res.status(500).send('Internal server error');
  }
});