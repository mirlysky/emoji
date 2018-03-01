<?php

/* 取得输入流 */
$img = file_get_contents('php://input', 'r'); 
if(empty($img)){
    exit("img is empty");
}

/* 取得SN号 */
$sn = $_GET['sn'];
if(empty($sn)){
    exit("sn is empty");
}

/* 取得设备标题 */
$tit = $_GET['from'];
if(empty($tit)){
    exit("tit by from - is empty");
}



/* JS截图时候取得的用户系统时间戳 */
$img_id = $_GET['id'];
if(empty($img_id)){
    $img_id=time()*1000;
}

/* 开始云存储 */
$s = new SaeStorage();
$s_bucke = "upimg";
$_data_filename = '_data_.json';

/* 读取数据文件 */
$_data_txt = $s->read($s_bucke, $_data_filename); 
if(!$_data_txt){
    $_data_txt = '{ "imgs":{}, "names":{} }';
}
$_data_json = json_decode($_data_txt,true);

/* 写入上传图片到云存 */
if( $s->write($s_bucke, $sn.'_'.$img_id.'.jpg' , $img) ){
    
    $imgs = &$_data_json['imgs'];
    if(!isset($imgs[$sn])){
        $imgs[$sn] = array();
    }
    $imgs[$sn][] = $img_id;
    $_data_json['names'][$sn] = $tit;
    
    //更新数据文件
    $s->write($s_bucke, $_data_filename , json_encode($_data_json));
            
    echo "ok";
}else{
    echo "err";
}

?>
