use image::load_from_memory;
use ravif::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn convert_to_avif(data: &[u8], quality: f32, speed: u8) -> Result<Vec<u8>, JsValue> {
    let img = load_from_memory(data)
        .map_err(|e| JsValue::from_str(&e.to_string()))?
        .to_rgba8();

    let width = img.width() as usize;
    let height = img.height() as usize;

    let pixels: Vec<RGBA8> = img
        .pixels()
        .map(|p| RGBA8::new(p[0], p[1], p[2], p[3]))
        .collect();

    let res = Encoder::new()
        .with_quality(quality)
        .with_speed(speed)
        .encode_rgba(Img::new(&pixels, width, height))
        .map_err(|e| JsValue::from_str(&format!("AVIF Error: {:?}", e)))?;

    Ok(res.avif_file)
}

#[wasm_bindgen]
pub fn convert_to_avif_resize(
    data: &[u8],
    quality: f32,
    speed: u8,
    target_width: u32,
    target_height: u32,
    crop: bool,
) -> Result<Vec<u8>, JsValue> {
    let img = load_from_memory(data).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let processed_img = if crop {
        img.resize_to_fill(
            target_width,
            target_height,
            image::imageops::FilterType::Lanczos3,
        )
    } else {
        img.resize(
            target_width,
            target_height,
            image::imageops::FilterType::Lanczos3,
        )
    };

    let final_rgba = processed_img.to_rgba8();
    let (w, h) = (final_rgba.width() as usize, final_rgba.height() as usize);

    let pixels: Vec<RGBA8> = final_rgba
        .pixels()
        .map(|p| RGBA8::new(p[0], p[1], p[2], p[3]))
        .collect();

    let res = Encoder::new()
        .with_quality(quality)
        .with_speed(speed)
        .encode_rgba(Img::new(&pixels, w, h))
        .map_err(|e| JsValue::from_str(&format!("AVIF Error: {:?}", e)))?;

    Ok(res.avif_file)
}
