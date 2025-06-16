import capacityIcon from '../icons/capacity.svg'

export default function Roomnumber ({floor, room, capacity}) {
    return(
    <div className="room-number">
        <div>
            <h1>\{floor} &gt; {room}</h1>
        </div>
        <div className="capacity-info">
            <img src={capacityIcon} alt="capacity" />
            <p>Capacity: {capacity} people</p>
        </div>
    </div>
    )
}