// Optional native rasterization of original SVG assets; requires macOS + Swift.
import AppKit
import Foundation
for path in CommandLine.arguments.dropFirst() {
    guard let image=NSImage(contentsOfFile:path) else {fatalError("Cannot read SVG: \(path)")}
    let width=min(image.size.width,1440)
    let target=NSSize(width:width,height:width*image.size.height/image.size.width)
    let output=NSImage(size:target)
    output.lockFocus()
    image.draw(in:NSRect(origin:.zero,size:target),from:.zero,operation:.sourceOver,fraction:1)
    output.unlockFocus()
    guard let tiff=output.tiffRepresentation,let bitmap=NSBitmapImageRep(data:tiff),
          let png=bitmap.representation(using:.png,properties:[:]) else {fatalError("Cannot encode PNG")}
    let destination=URL(fileURLWithPath:path).deletingPathExtension().appendingPathExtension("png")
    try png.write(to:destination)
    print(destination.path)
}
