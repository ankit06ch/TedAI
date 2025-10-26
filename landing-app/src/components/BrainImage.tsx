import React from 'react'

type Props = {
  src?: string
  alt?: string
}

export default function BrainImage({ 
  src = "/2.png", 
  alt = "Center visual" 
}: Props): React.JSX.Element {
  return (
    <div className="card center-image">
      <img src={src} alt={alt} />
    </div>
  )
}
