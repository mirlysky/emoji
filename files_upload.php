<?php

session_start();

ini_set('display_errors',1);
error_reporting(E_ALL);

/* 开始云存储 */
$imgPaths = array();
$errFileNames = array();
$uploads_dir = 'upload/';
$tmp = session_id();

if(!is_readable('upload/'.$tmp)){
    mkdir('upload/'.$tmp);
}

foreach ($_FILES as $f_key => $file){
    //echo(json_encode($file));
    if($file['error'] == 0){
        $type = getExtend($file['name']);
        //echo $type;
        $tmp_name = $file['tmp_name'];
        $name = md5_file($tmp_name).'_'.rand(100,time());
        if(move_uploaded_file($tmp_name,"$uploads_dir$tmp/$name.$type")){
            $imgPaths[] = "$tmp/$name.$type";
        }
    }
}
    
/* 输出写入的内容 */
if( count($imgPaths)>0 ){
    echo json_encode($imgPaths);
}else{
    echo 'err';
}

function getExtend($file_name){
    $extend = pathinfo($file_name);
    $extend = strtolower($extend['extension']);
    return $extend;
}    
?>
