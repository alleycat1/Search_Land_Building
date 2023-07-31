import React, { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, useMap, Polygon, useMapEvents, GeoJSON } from "react-leaflet";
import axios from "axios";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import HamburgerMenu from "./HamburgerMenu";
import RightHamburgerMenu from "./RightHamburgerMenu";
import Head from "next/head";
import wkx from 'wkx';

const maincenter = [35.67843, 139.764603];

//csv書き出し
export const downloadCsv = (data) => {
  try {
    // csvのセルに直接反映される。ここでAPIを呼び出す必要性がある。
    const rows = [
      ["TYPE","不動産ID", "CHIBAN_NUM", "住所", "座標"],
    ];
    for(var i=0;i<data.length;i++)
      rows.push([data[i].result_type, data[i].rs_id, data[i].full_name.trim(), data[i].chiban_num, data[i].rep_pnt_lat1 + " " + data[i].rep_pnt_lon1]);
    // rowsからcsvの形式に変換
    const csv = Papa.unparse(rows);
    // Blobを造り、xxxxxx.xxxxxxx..xxxxx.aaa.csvをクリック後にダウンロード
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, csv], { type: "text/csv;charset=utf-8;" });
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    const dateTimeString = `${year}${month}${day}_${hour}${minute}${second}`;
    saveAs(blob, dateTimeString+".csv");//"xxxxxx.xxxxxxx..xxxxx.aaa.csv");
  } catch (error) {
    console.error(error);
  }
};

//地図の位置の設定
export function ChangeView({ coords }) {
  const map = useMap();
  map.setView(coords, 12);
  return null;
}

export async function getServerSideProps() {
  const res1 = await fetch(`http://localhost:5000/search1?type=1`)
  const data1 = await res1.json();
  const res2 = await fetch(`http://localhost:5000/search1?type=2`)
  const data2 = await res2.json();
  const res4 = await fetch(`http://localhost:5000/search1?type=3`)
  const data4 = await res4.json();
  return {
      props: { 
          prefNames:data1, cityNames:data2, houseTypes:data4,
      }
  }
}

export default function Map({props}) {
  //　東京を初期位置に
  const [geoData, setGeoData] = useState({ lat: 35.68, lng: 139.76 });
  const center = [geoData.lat, geoData.lng];

  


  //切替 画面が小さい場合
  const [content, setContent] = useState("a");
  const handleClick = (newContent) => {
    setContent(newContent);
  };

  const [showSuggestions, setShowSuggestions] = useState(false);
  const handleToggleSuggestions = () => {
    setShowSuggestions(!showSuggestions);
  };

  const fileInputRef = useRef(null);

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    // 選択されたファイルの処理を行う
    console.log(file);
  };

  const buttonRef = useRef(null);

  useEffect(() => {
    buttonRef.current.focus();
  }, []);

  useEffect(() => {
    async function test() {
      try {
        const response = await axios.get("http://localhost:5000/views");
        const data = response.data;
        const allFullNames = data.map((row) => row.full_name);
        setFullNames2(allFullNames);
      } catch (error) {
        console.error(error);
      }
    }
    test();
  }, []);


  const [searchResults, setSearchResults] = useState([]);

  const [data, setData] = useState([]);
  const [prefecture, setPrefecture] = useState("");
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState("");
  const [fullNames, setFullNames] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const [isButtonClicked2, setIsButtonClicked2] = useState(false);
  const [displayedSearchResults, setDisplayedSearchResults] = useState([]);
  //const [jukyoNum, setJukyoNum] = useState("");
  const [chibanNum, setChibanNum] = useState("");
  const [searchText2, setSearchText2] = useState("");

  const [subcenter, setSubCenter] = useState([35.65,  139.72]);

  const uniquePrefectures = [...new Set(data.map((item) => item.pref_name))];
  
  useEffect(() => {
    async function fetchData() {
      const response = await axios.get("http://localhost:5000/api");
      setData(response.data);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (prefecture !== "") {
      const filteredCities = data
        .filter((item) => item.pref_name === prefecture)
        .map(
          (item) =>
            item.city_name + (item.od_city_name ? item.od_city_name : "")
        );
      setCities(filteredCities);
    } else {
      setCities([]);
    }
  }, [prefecture, data]);
  
    /*
    useEffect(() => {
      async function fetchFullNames() {
          if (isButtonClicked && prefecture !== "" && city !== "" && searchText !== "") {
              const filteredData = data.filter(
                  (item) =>
                      item.pref_name === prefecture &&
                      (item.city_name + (item.od_city_name ? item.od_city_name : "")) === city
              );
              if (filteredData.length > 0) {
                  const lgCodePrefix = filteredData[0].lg_code.substring(0, 6);
                  try {
                      const response = await axios.get("http://localhost:5000/views", {
                          params: { lgCodePrefix, searchText, jukyoNum },
                      });
                      const filteredFullNames = response.data.map((row) => row.full_name);
                      setFullNames(filteredFullNames);
                  } catch (error) {
                      console.error(error);
                  }
              }
          }
          setIsButtonClicked(false);
      }
      fetchFullNames();
  }, [isButtonClicked, prefecture, city, data, searchText, jukyoNum]);
  */

  useEffect(() => {
    async function fetchFullNames2() {
        if (isButtonClicked2 && prefecture !== "" && city !== "" && searchText2 !== "") {
            const filteredData = data.filter(
                (item) =>
                    item.pref_name === prefecture &&
                    (item.city_name + (item.od_city_name ? item.od_city_name : "")) === city
            );
            if (filteredData.length > 0) {
                const lgCodePrefix = filteredData[0].lg_code.substring(0, 6);
                try {
                    const response = await axios.get("http://localhost:5000/views2", {
                        params: { lgCodePrefix, searchText2, chibanNum },
                    });
                    const filteredFullNames = response.data.map((row) => row.full_name);
                    console.log(response.data.map((row) => row.full_name));
                    setFullNames(filteredFullNames);
                } catch (error) {
                    console.error(error);
                }
            }
        }
        setIsButtonClicked2(false);
    }
    fetchFullNames2();
  }, [isButtonClicked2, prefecture, city, data, searchText2, chibanNum]);
  
    useEffect(() => {
      setCurrentPage(1);
    }, [itemsPerPage]);
  
    useEffect(() => {
      setDisplayedSearchResults([]);
      if (isButtonClicked) {
        const filteredNames = fullNames.filter((fullName) =>
          containsSearchText(fullName, searchText)
        );
        setDisplayedSearchResults(filteredNames);
      } else {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const slicedNames = searchResults.slice(startIndex, endIndex);
        setDisplayedSearchResults(slicedNames);
      }
    }, [fullNames, itemsPerPage, currentPage, searchText, isButtonClicked]);

    useEffect(() => {
      if (isButtonClicked2) {
        const filteredNames = fullNames.filter((fullName) =>
          containsSearchText(fullName, searchText2)
        );
        setDisplayedSearchResults(filteredNames);
      } else {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const slicedNames = searchResults.slice(startIndex, endIndex);
        setDisplayedSearchResults(slicedNames);
      }
    }, [fullNames, itemsPerPage, currentPage, searchText2, isButtonClicked2]);
  
    const totalPages = Math.ceil(searchResults.length / itemsPerPage);
  
    const nextPage = () => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    };
  
    const previousPage = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    };
  
    const handleItemsPerPageChange = (event) => {
      setItemsPerPage(Number(event.target.value));
    };
  
    const handleButtonClick = () => {
      setIsButtonClicked(true);
    };

    const handleButtonClick2 = () => {
      setIsButtonClicked2(true);
    };
  
    const containsSearchText = (text, search) => {
      if (text.includes(search)) {
        return true;
      }
      const kanaText = convertToKana(text);
      const kanaSearch = convertToKana(search);
      return kanaText.includes(kanaSearch) || text.includes(search);
    };
  
    const convertToKana = (text) => {
      // Kana変換の処理
      return text;
    };

    const [data2, setData2] = useState([]);
    const [zoomLevel, setZoomLevel] = useState(20); // <-- Add this

    useEffect(() => {
      axios.get('http://localhost:5000/bbb')
        .then(response => {
          const geojsons = response.data.map(record => {
            const buffer = Buffer.from(record.plygn_geom1, 'hex');
            const geometry = wkx.Geometry.parse(buffer);
            return geometry.toGeoJSON();
          });
          setData2(geojsons);
        })
        .catch(error => console.error(error));
    }, []);

    const MapEvents = () => { // <-- Add this
      const map = useMapEvents({
        zoomend: () => {
          setZoomLevel(map.getZoom());
        },
      });
      return null;
    };

    //ここで全ての検索をかけるコードが途中の為コメントアウト
    //useEffect(() => {
    //  async function fetchFullNames2() {
    //      if (isButtonClicked2 && prefecture !== "" && city !== "" && searchText2 !== "" && searchText3 !== "" && searchText4 !== "" && searchText5 !== ) {
    //          const filteredData = data.filter(
    //              (item) =>
    //                  item.pref_name === prefecture &&
    //                  (item.city_name + (item.od_city_name ? item.od_city_name : "")) === city
    //          );
    //          if (filteredData.length > 0) {
    //              const lgCodePrefix = filteredData[0].lg_code.substring(0, 6);
    //              try {
    //                  const response = await axios.get("http://localhost:5000/test7", {
    //                      params: { odouhuken, sikuchouson, machiwaza, gaikujukyo, syurui, kozo, yukamenseki, tatemonomei },
    //                  });
    //                  const filteredFullNames = response.data.map((row) => row.full_name);
    //                  console.log(response.data.map((row) => row.full_name));
    //                  setFullNames(filteredFullNames);
    //              } catch (error) {
    //                  console.error(error);
    //              }
    //          }
    //      }
    //      setIsButtonClicked2(false);
    //  }
    //  fetchFullNames2();
    //}, [isButtonClicked2, prefecture, city, data, searchText2, chibanNum]);

  // Aku changed
  const [prefName, setPrefName] = useState('');
  const [lgCode, setLgCode] = useState('');
  const [juukyoName, setJuukyoName] = useState('');
  const [jukyoNum, setJukyoNum] = useState('');
  const [houseNum, setHouseNum] = useState('');
  const [houseType, setHouseType] = useState('');
  const [structureVal, setStructureVal] = useState('');
  const [redistDate, setRedistDate] = useState('');
  const [redistDateScope, setRedistDateScope] = useState(0);
  const [cmsBldgName, setCmsBldgName] = useState('');
  const [landSpace, setLandSpace] = useState('');
  const [landSpaceScope, setLandSpaceScope] = useState(0);
  const prefNamesArray = [...props.prefNames];
  const cityNamesArray = [...props.cityNames];
  const houseTypesArray = [...props.houseTypes];

  //const [chibanNum, setChibanNum] = useState('');
  const [landType, setLandType] = useState('');
  const [landSpace1, setLandSpace1] = useState('');
  const [landSpace1Scope, setLandSpace1Scope] = useState(0);
  const [redistDate1, setRedistDate1] = useState('');
  const [redistDate1Scope, setRedistDate1Scope] = useState(0);
  const [redistDate2, setRedistDate2] = useState('');
  const [redistDate2Scope, setRedistDate2Scope] = useState(0);
  const [landSpace2, setLandSpace2] = useState('');
  const [landSpace2Scope, setLandSpace2Scope] = useState(0);
  const landTypesArray = [{'land_idx':'0','land_type':'その他'},
                          {'land_idx':'10','land_type':'宅地'},
                          {'land_idx':'31','land_type':'学校用地'},
                          {'land_idx':'32','land_type':'公園'},
                          {'land_idx':'33','land_type':'境内地'},
                          {'land_idx':'34','land_type':'墓地'},
                          {'land_idx':'35','land_type':'公衆用道路'},
                          {'land_idx':'36','land_type':'鉄道用地'},
                          {'land_idx':'40','land_type':'田'},
                          {'land_idx':'50','land_type':'畑'},
                          {'land_idx':'60','land_type':'牧場'},
                          {'land_idx':'71','land_type':'山林'},
                          {'land_idx':'72','land_type':'保安林'},
                          {'land_idx':'73','land_type':'原野'},
                          {'land_idx':'81','land_type':'堤'},
                          {'land_idx':'82','land_type':'水道用地'},
                          {'land_idx':'83','land_type':'運河用地'},
                          {'land_idx':'84','land_type':'用悪水路'},
                          {'land_idx':'85','land_type':'井溝'},
                          {'land_idx':'86','land_type':'ため池'},
                          {'land_idx':'87','land_type':'池沼'},
                          {'land_idx':'88','land_type':'鉱泉地'},
                          {'land_idx':'89','land_type':'塩田'},
                          {'land_idx':'90','land_type':'雑種地'}];

  const [rsIdStart, setRsIdStart] = useState('');
  const [rsIdEnd, setRsIdEnd] = useState('');
  
  const handleRsIdStartChange = (e) => {
    setRsIdStart(e.target.value);
  };
  const handleRsIdEndChange = (e) => {
    setRsIdEnd(e.target.value);
  };

  const handlePrefNameChange = (e) => {
    setPrefName(e.target.value);
  };
  const handleCityNameChange = (e) => {
    setLgCode(e.target.value);
  };
  const handleJuukyoNameChange = (e) => {
    setJuukyoName(e.target.value);
  };
  const handleJukyoNumChange = (e) => {
    setJukyoNum(e.target.value);
  };
  const handleHouseNum = (e) => {
    setHouseNum(e.target.value);
  };
  const handleHouseTypeChange = (e) => {
    setHouseType(e.target.value);
  };
  const handleStructureVal = (e) => {
    setStructureVal(e.target.value);
  };
  const handleRedistDate = (e) => {
    setRedistDate(e.target.value);
  };
  const handleRedistDateScope = (e) => {
    setRedistDateScope(e.target.value);
  };
  const handleCmsBldgName = (e) => {
    setCmsBldgName(e.target.value);
  };
  const handleLandSpace = (e) => {
    setLandSpace(e.target.value);
  };
  const handleLandSpaceScope = (e) => {
    setLandSpaceScope(e.target.value);
  };

  const handleChibanNumChange = (e) => {
    setChibanNum(e.target.value);
  };
  const handleLandTypeChange = (e) => {
    setLandType(e.target.value);
  };
  const handleLandSpace1 = (e) => {
    setLandSpace1(e.target.value);
  };
  const handleLandSpace1Scope = (e) => {
    setLandSpace1Scope(e.target.value);
  };
  const handleRedistDate1 = (e) => {
    setRedistDate1(e.target.value);
  };
  const handleRedistDate1Scope = (e) => {
    setRedistDate1Scope(e.target.value);
  };
  const handleRedistDate2 = (e) => {
    setRedistDate2(e.target.value);
  };
  const handleRedistDate2Scope = (e) => {
    setRedistDate2Scope(e.target.value);
  };
  const handleLandSpace2 = (e) => {
    setLandSpace2(e.target.value);
  };
  const handleLandSpace2Scope = (e) => {
    setLandSpace2Scope(e.target.value);
  };

  const handleSearch1 = async (e) => {
    e.preventDefault();
    try {
      if(prefName == '' || lgCode == '' || juukyoName=='')
        alert('pref_name, lg_code and juukyo_name are required');
      else
      {
        const res = await axios.get(`http://localhost:5000/search_filter1`,{
            params: { prefName, lgCode, juukyoName, jukyoNum,
                      houseNum, houseType, structureVal, redistDate, redistDateScope, 
                      cmsBldgName, landSpace, landSpaceScope },
        });
        setSearchResults(res.data);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const slicedNames = res.data.slice(startIndex, endIndex);
        setDisplayedSearchResults(slicedNames);
      }
    } catch (error) {
        console.error(error);
    }
  };

  const handleSearch2 = async (e) => {
    e.preventDefault();
    try {
      if(prefName == '' || lgCode == '' || juukyoName=='')
        alert('pref_name, lg_code and juukyo_name are required');
      else
      {
        var data=[];
        {
          const res = await axios.get(`http://localhost:5000/search1`,{
              params: { prefName, lgCode, juukyoName, chibanNum, 
                        landType, landSpace1, landSpace1Scope, redistDate1, redistDate1Scope },
          });
          data.push(...res.data);
        }
        {
          const res = await axios.get(`http://localhost:5000/search2`,{
              params: { prefName, lgCode, juukyoName, chibanNum, houseNum, houseType, structureVal,
                        redistDate2, redistDate2Scope, cmsBldgName, 
                        //bldgName, 
                        landSpace2, landSpace2Scope },
          });
          data.push(...res.data);
        }
        setSearchResults(data);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const slicedNames = data.slice(startIndex, endIndex);
        setDisplayedSearchResults(slicedNames);
      }
    } catch (error) {
        console.error(error);
    }
  };

  const handleSearch21 = async (e) => {
    e.preventDefault();
    try {
      if(prefName == '' || lgCode == '' || juukyoName=='')
        alert('pref_name, lg_code and juukyo_name are required');
      else
      {
        const res = await axios.get(`http://localhost:5000/search1`,{
            params: { prefName, lgCode, juukyoName, chibanNum, 
                      landType, landSpace1, landSpace1Scope, redistDate1, redistDate1Scope },
        });
        console.log(res.data);
        setSearchResults(res.data);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const slicedNames = res.data.slice(startIndex, endIndex);
        setDisplayedSearchResults(slicedNames);
      }
    } catch (error) {
        console.error(error);
    }
  };

  const handleSearch22 = async (e) => {
    e.preventDefault();
    try {
      if(prefName == '' || lgCode == '' || juukyoName=='')
        alert('pref_name, lg_code and juukyo_name are required');
      else
      {
        const res = await axios.get(`http://localhost:5000/search2`,{
            params: { prefName, lgCode, juukyoName, chibanNum, houseNum, houseType, structureVal,
                      redistDate2, redistDate2Scope, cmsBldgName, 
                      //bldgName, 
                      landSpace2, landSpace2Scope },
        });
        setSearchResults(res.data);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const slicedNames = res.data.slice(startIndex, endIndex);
        setDisplayedSearchResults(slicedNames);
      }
    } catch (error) {
        console.error(error);
    }
  };

  const handleSearch3 = async (e) => {
    e.preventDefault();
    try {
      if(rsIdStart == '' || rsIdEnd == '')
        alert('The rs_id start and end values are required');
      else
      {
        const res = await axios.get(`http://localhost:5000/search_filter3`,{
            params: { rsIdStart, rsIdEnd },
        });
        setSearchResults(res.data);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const slicedNames = res.data.slice(startIndex, endIndex);
        setDisplayedSearchResults(slicedNames);
      }
    } catch (error) {
        console.error(error);
    }
  };

  return (
    <>
      <Head></Head>

      <header className="relative border font-sans font-semibold w-[100%] py-3 max-sm:py-1.5 bg-slate-100 border-b-slate-500">
        <ul className="flex list-none justify-between item-center">
          <li className="w-[50%] lg:w-[350px]">
            <div className="text-lg max-sm:text-xs bg-slate-400 text-center py-1 text-slate-100 shadow-[0_0px_3px_0px_rgb(0,0,0)] rounded-r-md">
              <span className="text-slate-100">{"不動産ID"}</span>
              <br />
              <span className="text-lg max-sm:text-xs">
                {"確認用Web"}
              </span>
            </div>
          </li>
          <li className="flex list-none mt-3 max-sm:mt-2">
            <img
              className="w-8 h-8 max-sm:w-5 max-sm:h-5 max-md:w-6 max-md:h-6"
              src="logout.svg"
            />
            <RightHamburgerMenu />
          </li>
        </ul>
      </header>

      <main className="relative font-sans font-medium w-[100%]">
        <HamburgerMenu />
        <ul className="relative w-[100%] flex list-none bg-slate-100">
          <li className="border-r border-slate-600 shadow-[0_0px_10px_0px_rgb(119,119,119)] text-base h-screen w-[30%] max-sm:text-xs lg:text-lg p-0 z-10">
            <ul className="list-none flex item-center">
              <li
                id="button1"
                className={`bg-slate-100 cursor-pointer border-l-0 border-t border-b-0 max-sm:border-r-0 focus-visible:outline-none border-slate-600 w-[100%] h-10 max-sm:text-[0.1px] text-sm text-center px-0 flex items-center justify-center max-md:border-b-0 ${content === 'a' ? 'bg-slate-400' : ''}`}
                tabIndex={0}
                onClick={() => handleClick("a")}
                ref={buttonRef}
              >
                {"住居表示住所検索"}
              </li>
              <li
                className={`bg-slate-100 cursor-pointer border-l-0 border-t border-b-0 border-slate-600 w-[100%] h-10 max-sm:text-[0.1px] text-sm text-center px-0 flex items-center justify-center max-md:hidden max-md:block ${content === 'b' ? 'bg-slate-400' : ''}`}
                tabIndex={0}
                onClick={() => handleClick("b")}
              >
                {"地番検索"}
              </li>
              <li
                className={`bg-slate-100 cursor-pointer border-l-0 border-t border-b-0 border-slate-600 w-[100%] h-10 max-sm:text-[0.1px] text-sm text-center px-0 flex items-center justify-center max-md:hidden max-md:block ${content === 'c' ? 'bg-slate-400' : ''}`}
                tabIndex={0}
                onClick={() => handleClick("c")}
              >
                {"不動産ID検索"}
              </li>
            </ul>
            <div>
              {content === "a" && (
                <div className="shadow-[0_0px_10px_0px_rgb(119,119,119)] border-b border-slate-600 bg-slate-400 text-base max-sm:text-xs lg:text-lg border-b border-slate-600 py-5">
                  <ul className="list-none">
                    <li className="relative left-[5%]">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>
                          {"都道府県"}
                          <span className="text-[13px] max-sm:text-[0.1px] text-red-600 px-1">
                            {"必須"}
                          </span>
                        </div>
                        <div>
                          <select
                            className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-5 max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                            value={prefName}
                            onChange={handlePrefNameChange}
                          >
                            <option value="" />
                            {prefNamesArray.map((pref, index)=>(
                                <option key={index} value={pref.pref_code}>{pref.pref_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>
                          {"市区町村"}
                          <span className="text-[13px] max-sm:text-[0.1px] text-red-600 px-1">
                            {"必須"}
                          </span>
                        </div>
                        <div>
                          <select
                            className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-5 max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                            value={lgCode}
                            onChange={handleCityNameChange}
                          >
                            <option value=""></option>
                            {cityNamesArray.map((city, index)=>(
                                <option key={index} value={city.lg_code} hidden={!city.lg_code.startsWith(prefName)}>{city.city_name} {city.od_city_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-col flex">
                        <div>
                          {"町字/町丁目/小字"}
                          <span className="text-[13px] max-sm:text-[0.1px] text-red-600 px-1">
                            {"必須"}
                          </span>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={juukyoName}
                            onChange={handleJuukyoNameChange}
                            onClick={handleToggleSuggestions}
                            className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[85%] max-sm:w-[4.5rem]"
                          />
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-col flex">
                        <div>{"街区・住居番号"}</div>
                        <div>
                          <input 
                            className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[85%] max-sm:w-[4.5rem]"
                            type="text"
                            value={jukyoNum}
                            onChange={handleJukyoNumChange} 
                          />
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[5%] mt-5 border-b border-black w-[85%] border-dotted">
                      <span>{"建物検索"}</span>
                    </li>
                    <li className="relative left-[5%] mt-2">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>{"家屋番号"}</div>
                        <div>
                          <input className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-14 max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                            type="text"
                            value={houseNum}
                            onChange={handleHouseNum} 
                          />
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>{"種類"}</div>
                        <div>
                          <select className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[92px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                            value={houseType}
                            onChange={handleHouseTypeChange}
                          >
                            <option value=""></option>
                            {houseTypesArray.map((house, index)=>(
                                <option key={index} value={house.house_type}>{house.house_type}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>{"構造"}</div>
                        <div>
                          <input className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[92px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]" 
                            type="text"
                            value={structureVal}
                            onChange={handleStructureVal} 
                          />
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>{"床面積"}</div>
                        <div>
                          <input className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[74px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[7rem] max-sm:w-[4rem]"
                            type="text"
                            value={landSpace}
                            onChange={handleLandSpace} 
                          />
                          <span className="ml-1 text-xs max-sm:text-[0.1px]">
                            {"(㎡)"}
                          </span>
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[11.7%] max-md:left-[5%] mt-1">
                      <select className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[92px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                        value={landSpaceScope}
                        onChange={handleLandSpaceScope}
                      >
                        <option value="0">{"より以上"}</option>
                        <option value="1">{"より以下"}</option>
                      </select>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>{"登記日"}</div>
                        <div>
                          <input
                            type="date"
                            className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[74px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                            value={redistDate}
                            onChange={handleRedistDate}
                          ></input>
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[11.7%] max-sm:left-[5%] mt-1">
                      <select className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[92px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                        value={redistDateScope}
                        onChange={handleRedistDateScope}
                      >
                        <option value="0">{"より以前"}</option>
                        <option value="1">{"より以後"}</option>
                      </select>
                    </li>
                    <li>
                      <li className="relative left-[5%] mt-3">
                        <div className="flex-col flex">
                          <div>{"建物名"}</div>
                          <div>
                            <input className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[85%] max-sm:w-[4.5rem]" 
                              value={cmsBldgName}
                              onChange={handleCmsBldgName}
                            />
                          </div>
                        </div>
                      </li>
                    </li>
                    <li className="relative right-[10%] mt-2 flex justify-end">
                      <button
                        className="border border-[#003ee5] shadow-[0_0px_3px_0px_rgb(0,0,0)] hover:border hover:border-[#0030b2] rounded bg-[#003ee5] hover:bg-[#0030b2] px-3 py-1 text-[#ffffff] focus:outline-none focus:ring-4 focus:ring-[#ddb265]"
                        onClick={handleSearch1}
                      >
                        {"検索"}
                      </button>
                    </li>
                    <li className="relative left-[5%] mt-5 border-b border-black w-[85%] border-dotted">
                      <span>{"住居表示住所一括検索"}</span>
                    </li>
                    <li className="relative left-[5%] mt-3">
                      <div className="flex-col flex">
                        <div className="flex items-center">
                          <label
                            htmlFor="fileInput"
                            className="shadow-[0_0px_8px_0px_rgb(60,60,60)] bg-white rounded focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[85%] max-sm:w-[4.5rem]"
                          >
                            <input
                              id="fileInput"
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              style={{
                                display: "none",
                              }}
                              accept="image/*"
                            />
                            <img
                              src="file.svg"
                              alt="画像"
                              className="h-7 cursor-pointer ml-auto"
                              onClick={handleFileClick}
                            />
                          </label>
                        </div>
                      </div>
                    </li>
                    <li className="relative right-[10%] mt-2 flex justify-end">
                      <button
                        className="border border-[#003ee5] shadow-[0_0px_3px_0px_rgb(0,0,0)] hover:border hover:border-[#0030b2] rounded bg-[#003ee5] hover:bg-[#0030b2] px-3 py-1 text-[#ffffff] focus:outline-none focus:ring-4 focus:ring-[#ddb265]"
                        onClick={handleButtonClick}
                      >
                        {"検索"}
                      </button>
                    </li>
                  </ul>
                </div>
              )}
              {content === "b" && (
                <div className="shadow-[0_0px_10px_0px_rgb(119,119,119)] border-b border-slate-600 bg-slate-400 py-5 text-base max-sm:text-xs lg:text-lg">
                  <ul className="list-none">
                  <li className="relative left-[5%]">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>
                          {"都道府県"}
                          <span className="text-[13px] max-sm:text-[0.1px] text-red-600 px-1">
                            {"必須"}
                          </span>
                        </div>
                        <div>
                          <select
                            className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-5 max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                            value={prefName}
                            onChange={handlePrefNameChange}
                          >
                            <option value="" />
                            {prefNamesArray.map((pref, index)=>(
                                <option key={index} value={pref.pref_code}>{pref.pref_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>
                          {"市区町村"}
                          <span className="text-[13px] max-sm:text-[0.1px] text-red-600 px-1">
                            {"必須"}
                          </span>
                        </div>
                        <div>
                          <select
                            className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-5 max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                            value={lgCode}
                            onChange={handleCityNameChange}
                          >
                            <option value=""></option>
                            {cityNamesArray.map((city, index)=>(
                                <option key={index} value={city.lg_code} hidden={!city.lg_code.startsWith(prefName)}>{city.city_name} {city.od_city_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-col flex">
                        <div>
                          {"町字/町丁目/小字"}
                          <span className="text-[13px] max-sm:text-[0.1px] text-red-600 px-1">
                            {"必須"}
                          </span>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={juukyoName}
                            onChange={handleJuukyoNameChange}
                            onClick={handleToggleSuggestions}
                            className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[85%] max-sm:w-[4.5rem]"
                          />
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-col flex">
                        <div>{"地番"}</div>
                        <div>
                          <input
                            type="text"
                            className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[85%] max-sm:w-[4.5rem]"
                            value={chibanNum}
                            onChange={handleChibanNumChange} 
                          />
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[5%] mt-5 border-b border-black w-[85%] border-dotted">
                      <span>
                        <span>{"土地検索条件"}</span>
                      </span>
                    </li>
                    <li className="relative left-[5%] mt-2">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>{"地目"}</div>
                        <div>
                          <select className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[92px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                            value={landType} onChange={handleLandTypeChange} >
                          <option key="" value=""></option>
                            {landTypesArray.map((land, index)=>(
                                <option key={index} value={land.land_idx}>{land.land_type}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>{"地積"}</div>
                        <div>
                          <input className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[92px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[7rem] max-sm:w-[4rem]"
                            value={landSpace1} onChange={handleLandSpace1}
                          />
                          <span className="ml-1 text-xs max-sm:text-[0.1px]">
                            {"(㎡)"}
                          </span>
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[11.7%] max-lg:ml-3 mt-1">
                      <select className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[92px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                        value={landSpace1Scope} onChange={handleLandSpace1Scope}
                      >
                        <option value="0">{"より以上"}</option>
                        <option value="1">{"より以下"}</option>
                      </select>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>{"登記日"}</div>
                        <div>
                          <input
                            type="date"
                            className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[74px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                            value={redistDate1} onChange={handleRedistDate1}
                          />
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[11.7%] max-lg:ml-3 mt-1">
                      <select className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[92px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                        value={redistDate1Scope} onChange={handleRedistDate1Scope}
                      >
                        <option value="0">{"より以前"}</option>
                        <option value="1">{"より以後"}</option>
                      </select>
                    </li>
                    <li className="relative left-[5%] mt-5 border-b border-black w-[85%] border-dotted">
                      <span>
                        <span>{"建物検索条件"}</span>
                      </span>
                    </li>
                    <li className="relative left-[5%] mt-2">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>{"家屋番号"}</div>
                        <div>
                          <input className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-14 max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                            value={houseNum} onChange={handleHouseNum}
                          />
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>{"種類"}</div>
                        <div>
                          <select className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[92px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                            value={houseType} onChange={handleHouseTypeChange}
                          >
                            <option key="" value=""></option>
                            {houseTypesArray.map((house, index)=>(
                                <option key={index} value={house.house_type}>{house.house_type}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>{"構造"}</div>
                        <div>
                          <input className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[92px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                            value={structureVal} onChange={handleStructureVal}
                          />
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>{"床面積"}</div>
                        <div>
                          <input className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[74px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[7rem] max-sm:w-[4rem]"
                            value={landSpace2} onChange={handleLandSpace2}
                          />
                          <span className="ml-1 text-xs max-sm:text-[0.1px]">
                            {"(㎡)"}
                          </span>
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[11.7%] max-lg:ml-3 mt-1">
                      <select className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[92px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                        value={landSpace2Scope} onChange={handleLandSpace2Scope}
                      >
                        <option value="0">{"より以上"}</option>
                        <option value="1">{"より以下"}</option>
                      </select>
                    </li>
                    <li className="relative left-[5%] mt-1">
                      <div className="flex-row flex max-lg:flex-col">
                        <div>{"登記日"}</div>
                        <div>
                          <input
                            type="date"
                            className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[74px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                            value={redistDate2} onChange={handleRedistDate2}
                          ></input>
                        </div>
                      </div>
                    </li>
                    <li className="relative left-[11.7%] max-lg:ml-3 mt-1">
                      <select className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded ml-[92px] max-lg:ml-0 focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[10rem] max-sm:w-[4.5rem]"
                        value={redistDate2Scope} onChange={handleRedistDate2Scope}
                      >
                        <option value="0">{"より前"}</option>
                        <option value="1">{"より後"}</option>
                      </select>
                    </li>
                    <li>
                      <li className="relative left-[5%] mt-3 w-[85%]">
                        <div className="flex-col flex">
                          <div className="border-b border-black border-dotted">
                            {"建物名"}
                          </div>
                          <div className="py-3">
                            <input className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[100%] max-sm:w-[4.5rem]"
                              value={cmsBldgName} onChange={handleCmsBldgName}
                            />
                          </div>
                        </div>
                      </li>
                    </li>
                    <li className="relative right-[10%] mt-2 flex justify-end">
                      <ul className="relative lg:flex">
                        <li className="lg:flex">
                          <button
                            className="border border-[#003ee5] shadow-[0_0px_3px_0px_rgb(0,0,0)] hover:border hover:border-[#0030b2] rounded bg-[#003ee5] hover:bg-[#0030b2] px-3 py-1 text-[#ffffff] focus:outline-none focus:ring-4 focus:ring-[#ddb265]"
                            onClick={handleSearch21}
                          >
                            {"土地検索"}
                          </button>
                        </li>
                        <li className="lg:flex lg:px-3">
                          <button
                            className="border border-[#003ee5] shadow-[0_0px_3px_0px_rgb(0,0,0)] hover:border hover:border-[#0030b2] rounded bg-[#003ee5] hover:bg-[#0030b2] px-3 py-1 text-[#ffffff] focus:outline-none focus:ring-4 focus:ring-[#ddb265]"
                            onClick={handleSearch22}
                          >
                            {"建物検索"}
                          </button>
                        </li>
                        <li className="lg:flex">
                          <button
                            className="border border-[#003ee5] shadow-[0_0px_3px_0px_rgb(0,0,0)] hover:border hover:border-[#0030b2] rounded bg-[#003ee5] hover:bg-[#0030b2] px-3 py-1 text-[#ffffff] focus:outline-none focus:ring-4 focus:ring-[#ddb265]"
                            onClick={handleSearch2}
                          >
                            {"土地・建物検索"}
                          </button>
                        </li>
                      </ul>
                    </li>
                    <li className="relative left-[5%] mt-5 border-b border-black w-[85%] border-dotted">
                      <span>{"地番一括検索"}</span>
                    </li>
                    <li className="relative left-[5%] mt-3">
                      <div className="flex-col flex">
                        <div className="flex items-center">
                          <label
                            htmlFor="fileInput"
                            className="shadow-[0_0px_8px_0px_rgb(60,60,60)] bg-white rounded focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[85%] max-sm:w-[4.5rem]"
                          >
                            <input
                              id="fileInput"
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              style={{
                                display: "none",
                              }}
                              accept="image/*"
                            />
                            <img
                              src="file.svg"
                              alt="画像"
                              className="h-7 cursor-pointer ml-auto"
                              onClick={handleFileClick}
                            />
                          </label>
                        </div>
                      </div>
                    </li>
                    <li className="relative right-[10%] mt-2 flex justify-end">
                      <button
                        className="border border-[#003ee5] shadow-[0_0px_3px_0px_rgb(0,0,0)] hover:border hover:border-[#0030b2] rounded bg-[#003ee5] hover:bg-[#0030b2] px-3 py-1 text-[#ffffff] focus:outline-none focus:ring-4 focus:ring-[#ddb265]"
                        onClick={handleButtonClick2}
                      >
                        {"検索"}
                      </button>
                    </li>
                  </ul>
                </div>
              )}
              {content === "c" && (
                <div className="shadow-[0_0px_10px_0px_rgb(119,119,119)] border-b border-slate-600 bg-slate-400 py-5 text-base max-sm:text-xs lg:text-lg">
                  <ul className="list-none">
                    <li className="relative left-[5%]">
                      <div className="flex-col flex">
                        <div>
                          <span>{"不動産ID"}</span>
                          <span className="ml-1 text-[13px] max-sm:text-[0.1px] text-red-600">
                            {"必須"}
                          </span>
                        </div>
                        <div>
                          <ul className="flex justify-start w-[85%]">
                            <li>
                              <input
                                type="text"
                                className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[100%]"
                                value={rsIdStart} onChange={handleRsIdStartChange}
                              />
                            </li>
                            <li>
                              <div className="bg-black ml-0 mt-3.5 max-sm:mt-2 h-[1px] w-3 max-sm:w-1" />
                            </li>
                            <li>
                              <input
                                type="text"
                                className="shadow-[0_0px_8px_0px_rgb(60,60,60)] rounded focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[100%]"
                                value={rsIdEnd} onChange={handleRsIdEndChange}
                              />
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                    <li className="relative right-[10%] mt-2 flex justify-end">
                      <button
                        className="border border-[#003ee5] shadow-[0_0px_3px_0px_rgb(0,0,0)] hover:border hover:border-[#0030b2] rounded bg-[#003ee5] hover:bg-[#0030b2] px-3 py-1 text-[#ffffff] focus:outline-none focus:ring-4 focus:ring-[#ddb265]"
                        onClick={handleSearch3}//{handleToggleLabel2}
                      >
                        {"検索"}
                      </button>
                    </li>
                    <li className="relative left-[5%] mt-5 border-b border-black w-[85%] border-dotted">
                      <span>{"不動産ID一括検索"}</span>
                    </li>
                    <li className="relative left-[5%] mt-3">
                      <div className="flex-col flex">
                        <div className="flex items-center">
                          <label
                            htmlFor="fileInput"
                            className="shadow-[0_0px_8px_0px_rgb(60,60,60)] bg-white rounded focus:outline-none focus:ring-4 focus:ring-[#ddb265] w-[85%] max-sm:w-[4.5rem]"
                          >
                            <input
                              id="fileInput"
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              style={{
                                display: "none",
                              }}
                              accept="image/*"
                            />
                            <img
                              src="file.svg"
                              alt="画像"
                              className="h-7 cursor-pointer ml-auto"
                              onClick={handleFileClick}
                            />
                          </label>
                        </div>
                      </div>
                    </li>

                    <li className="relative right-[10%] mt-2 flex justify-end">
                      <button
                        className="border border-[#003ee5] shadow-[0_0px_3px_0px_rgb(0,0,0)] hover:border hover:border-[#0030b2] rounded bg-[#003ee5] hover:bg-[#0030b2] px-3 py-1 text-[#ffffff] focus:outline-none focus:ring-4 focus:ring-[#ddb265]"
                        //onClick={}//{handleToggleLabel2}
                      >
                        {"検索"}
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </li>
          <li className="relative h-screen w-[70%] bg-slate-100">
            <ul>
              <li>
                <div className="absolute rounded ring-2 ring-black ring-opacity-20 right-5 mt-6 z-50 bg-[#ffffff] text-black p-1.5">
                  <ul style={{ listStyle: "none" }}>
                    <li>
                      <input
                        type="radio"
                        id="xxx2"
                        name="xxx2"
                        value="xxx2"
                        defaultChecked
                      />
                      <label for="建物">{"建物"}</label>
                    </li>
                    <li>
                      <input type="radio" id="yyy2" name="xxx2" value="yyy2" />
                      <label for="地番">{"土地"}</label>
                    </li>
                  </ul>
                </div>
                <div className="relative border border-slate-600 border-r-0 shadow-[0_0px_10px_0px_rgb(119,119,119)] relative p-3 bg-slate-100 z-40">
                  <MapContainer center={maincenter} zoom={20} style={{ height: "60vh" }}>
                    <TileLayer
                      attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
                      url="https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"
                      maxZoom={20}
                      maxNativeZoom={18}
                    />
                    <MapEvents /> {/* <-- Add this */}
                    {(zoomLevel === 19 || zoomLevel === 20) && data2.map((geojson, index) => <GeoJSON key={index} data={geojson} />)}
                  </MapContainer>
                </div>
              </li>
              <li>
                <div className="relative border border-slate-600 border-r-0 shadow-[0_0px_10px_0px_rgb(119,119,119)] relative z-40 max-sm:text-xs bg-slate-100">
                  <ul className="flex justify-between text-center py-1">
                    <li className="p-2">{"検索結果"}</li>
                    <li className="p-2">
                      <button onClick={() => downloadCsv(searchResults)}>
                        <img className="h-6" src="downloadIcon.svg" />
                      </button>
                    </li>
                  </ul>
                  <ul>
                    <li className="flex justify-end">
                    <div>
        <button onClick={previousPage}>&lt;</button>
        <span>{currentPage}</span>/{totalPages}
        <button onClick={nextPage}>&gt;</button>
      </div>
      <select className="rounded" value={itemsPerPage} onChange={handleItemsPerPageChange}>
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
                    </li>
                  </ul>
                  <ul className="max-md:w-[100%] max-md:flex max-md:list-none max-md:hidden md:block">
                    <li className="max-md:w-[30%]">
                      <ul className="md:w-[100%] max-md:w-[100%] md:flex list-none border-b border-black border-dotted">
                        <li className="md:w-[5%] max-md:w-[100%] whitespace-nowrap overflow-x-auto">
                          <ul>
                            <li className="px-1 py-1 overflow-ellipsis">
                              {"区分"}
                            </li>
                          </ul>
                        </li>
                        <li className="md:w-[23.75%] max-md:w-[100%] whitespace-nowrap overflow-x-auto">
                          <ul>
                            <li className="px-1 py-1 overflow-ellipsis">
                              {"不動産ID"}
                            </li>
                          </ul>
                        </li>
                        <li className="md:w-[23.75%] max-md:w-[100%] whitespace-nowrap overflow-x-auto">
                          <ul>
                            <li className="px-1 py-1 overflow-ellipsis">
                              {"地番"}
                            </li>
                          </ul>
                        </li>
                        <li className="md:w-[23.75%] max-md:w-[100%] whitespace-nowrap overflow-x-auto">
                          <ul>
                            <li className="px-1 py-1 overflow-ellipsis">
                              {"住所"}
                            </li>
                          </ul>
                        </li>
                        <li className="md:w-[23.75%] max-md:w-[100%] whitespace-nowrap overflow-x-auto">
                          <ul>
                            <li className="px-1 py-1 overflow-ellipsis">
                              {"座標"}
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </ul>
                  {displayedSearchResults.map((result, index) => (
                    <ul className="max-md:w-[100%] max-md:flex max-md:list-none">
                      <li className="max-md:w-[30%]">
                        <ul className="md:w-[100%] max-md:w-[100%] md:flex list-none md:hidden md:block">
                          <li className="md:w-[5%] max-md:w-[100%] whitespace-nowrap overflow-x-auto">
                            <ul>
                              <li className="px-1 py-1 overflow-ellipsis">
                                {result.result_type}
                              </li>
                            </ul>
                          </li>
                          <li className="md:w-[23.75%] max-md:w-[100%] whitespace-nowrap overflow-x-auto">
                            <ul>
                              <li className="px-1 py-1 overflow-ellipsis">
                                {result.rs_id}
                              </li>
                            </ul>
                          </li>
                          <li className="md:w-[23.75%] max-md:w-[100%] whitespace-nowrap overflow-x-auto">
                            <ul>
                              <li className="px-1 py-1 overflow-ellipsis">
                                {result.chiban_num}
                              </li>
                            </ul>
                          </li>
                          <li className="md:w-[23.75%] max-md:w-[100%] whitespace-nowrap overflow-x-auto">
                            <ul>
                              <li className="px-1 py-1 overflow-ellipsis">
                                {result.full_name}
                              </li>
                            </ul>
                          </li>
                          <li className="md:w-[23.75%] max-md:w-[100%] whitespace-nowrap overflow-x-auto">
                            <ul>
                              <li className="px-1 py-1 overflow-ellipsis">
                                {result.rep_pnt_lat1}:{result.rep_pnt_lon1}
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                      <li className="max-md:w-[70%]">
                        <ul className="md:w-[100%] max-md:w-[100%] md:flex list-none">
                          <li className="md:w-[5%] max-md:w-[100%] whitespace-nowrap overflow-x-auto">
                            <ul>
                              <li className="px-1 py-1 overflow-ellipsis">
                                <img
                                  src={result.result_type == 2 ? 'home.svg' : 'ground.svg'}
                                  className="max-md:h-6 max-sm:h-4 md:h-6"
                                />
                              </li>
                            </ul>
                          </li>
                          <li className="md:w-[23.75%] max-md:w-[100%] whitespace-nowrap overflow-x-auto">
                            <ul>
                              <li className="px-1 py-1 overflow-ellipsis">
                                {result.rs_id}
                              </li>
                            </ul>
                          </li>
                          <li className="md:w-[23.75%] max-md:w-[100%] whitespace-nowrap overflow-x-auto">
                            <ul>
                              <li
                                className="px-1 py-1 overflow-ellipsis"
                                key={index}
                              >
                                {result.chiban_num}
                              </li>
                            </ul>
                          </li>
                          <li className="md:w-[23.75%] max-md:w-[100%] whitespace-nowrap overflow-x-auto">
                            <ul>
                              <li
                                className="px-1 py-1 overflow-ellipsis"
                                key={index}
                              >
                                {result.full_name}
                              </li>
                            </ul>
                          </li>
                          <li className="md:w-[23.75%] max-md:w-[100%] whitespace-nowrap overflow-x-auto">
                            <ul>
                              <li 
                                className="px-1 py-1 overflow-ellipsis cursor-pointer"
                                onClick={() => setSubCenter([result.rep_pnt_lat1, result.rep_pnt_lon1])}
                              >
                                {result.rep_pnt_lat1} {result.rep_pnt_lon1}
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  ))}
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </main>
    </>
  );
}
